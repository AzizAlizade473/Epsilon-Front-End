import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { clearAuthFlows } from '@/lib/auth-lifecycle';
import {
  clearFeedbackStorage,
  createFeedbackOutbox,
  feedbackOutboxPrefix,
  OutboxFullError,
  type OutboxEntry,
  type OutboxStorage,
} from '@/services/feedback-outbox';
import { ApiError } from '@/services/http/errors';
import type { FeedbackResult } from '@/services/contracts';

const now = 1_800_000_000_000;
const entry = (id = 'one'): OutboxEntry => ({
  receiptId: 'receipt',
  receiptItemId: id,
  rating: 2,
  comment: 'Keep this draft',
  reasonCodes: ['taste'],
  idempotencyKey: `stable-${id}`,
  createdAt: now,
});
const result: FeedbackResult = {
  feedbackId: 'fb',
  reward: { status: 'none', amountMinor: null },
};
const error = (
  code:
    'NETWORK' | 'TIMEOUT' | 'VALIDATION_FAILED' | 'FEEDBACK_ALREADY_SUBMITTED',
) => new ApiError({ code, message: 'Test', status: 0 });
let disk: Map<string, string>;
let storage: OutboxStorage;
beforeEach(() => {
  disk = new Map();
  storage = {
    getItem: async (key) => disk.get(key) ?? null,
    setItem: async (key, value) => {
      disk.set(key, value);
    },
    removeItem: async (key) => {
      disk.delete(key);
    },
    getAllKeys: async () => [...disk.keys()],
    multiRemove: async (keys) => {
      keys.forEach((key) => disk.delete(key));
    },
  };
});
describe('durable feedback outbox', () => {
  it('retains undated drafts across restart and anchors expiry only to trusted time', async () => {
    let trusted: number | null = null;
    const first = createFeedbackOutbox(
      'account',
      storage,
      async () => result,
      () => trusted,
    );
    await first.enqueue({ ...entry(), createdAt: null });
    first.stop();
    trusted = now;
    const restarted = createFeedbackOutbox(
      'account',
      storage,
      async () => result,
      () => trusted,
    );
    await restarted.load();
    expect(restarted.snapshot()).toEqual([{ ...entry(), createdAt: now }]);
    restarted.stop();
    trusted = now + 8 * 24 * 60 * 60 * 1000;
    const expired = createFeedbackOutbox(
      'account',
      storage,
      async () => result,
      () => trusted,
    );
    await expired.load();
    expect(expired.snapshot()).toEqual([]);
    expired.stop();
  });
  it('persists before sending and replays exact payload/key after process recreation', async () => {
    const firstSend = jest.fn(async () => {
      expect(disk.size).toBe(1);
      throw error('NETWORK');
    });
    const first = createFeedbackOutbox(
      'account',
      storage,
      firstSend,
      () => now,
    );
    await first.enqueue(entry());
    await first.flush();
    first.stop();
    const replay = jest.fn<
      (entry: OutboxEntry, signal: AbortSignal) => Promise<FeedbackResult>
    >(async () => result);
    const next = createFeedbackOutbox('account', storage, replay, () => now);
    await next.flush();
    expect(replay).toHaveBeenCalledWith(entry(), expect.any(AbortSignal));
    expect(next.snapshot()).toEqual([]);
    expect(disk.size).toBe(0);
  });
  it.each(['NETWORK', 'TIMEOUT'] as const)(
    'keeps ambiguous %s outcomes and coalesces flushes',
    async (code) => {
      const send = jest.fn(async () => {
        throw error(code);
      });
      const engine = createFeedbackOutbox('account', storage, send, () => now);
      await engine.enqueue(entry());
      await Promise.all([engine.flush(), engine.flush()]);
      expect(send).toHaveBeenCalledTimes(1);
      expect(engine.snapshot()).toEqual([entry()]);
    },
  );
  it.each(['FEEDBACK_ALREADY_SUBMITTED', 'VALIDATION_FAILED'] as const)(
    'drops terminal %s responses',
    async (code) => {
      const engine = createFeedbackOutbox(
        'account',
        storage,
        async () => {
          throw error(code);
        },
        () => now,
      );
      await engine.enqueue(entry());
      await engine.flush();
      expect(engine.snapshot()).toEqual([]);
      expect(engine.outcome(entry().idempotencyKey)?.kind).toBe(
        code === 'VALIDATION_FAILED' ? 'invalid' : 'duplicate',
      );
    },
  );
  it('bounds to 20, preserves the first item payload and prunes expired, future and malformed entries', async () => {
    disk.set(
      feedbackOutboxPrefix + 'account',
      JSON.stringify([
        { ...entry('old'), createdAt: now - 8 * 86400000 },
        { ...entry('future'), createdAt: now + 1 },
        { bad: true },
      ]),
    );
    const engine = createFeedbackOutbox(
      'account',
      storage,
      async () => result,
      () => now,
    );
    await engine.load();
    expect(engine.snapshot()).toEqual([]);
    for (let index = 0; index < 20; index++)
      await engine.enqueue(entry(String(index)));
    await engine.enqueue({
      ...entry('0'),
      rating: 5,
      idempotencyKey: 'changed',
    });
    expect(engine.snapshot()[0]?.rating).toBe(2);
    await expect(engine.enqueue(entry('overflow'))).rejects.toBeInstanceOf(
      OutboxFullError,
    );
  });
  it('scopes replay by account and clears only feedback storage', async () => {
    const engine = createFeedbackOutbox(
      'account-a',
      storage,
      async () => result,
      () => now,
    );
    await engine.enqueue(entry());
    const send = jest.fn(async () => result);
    await createFeedbackOutbox('account-b', storage, send, () => now).flush();
    expect(send).not.toHaveBeenCalled();
    disk.set('language', 'az');
    await clearFeedbackStorage(storage);
    expect([...disk.keys()]).toEqual(['language']);
  });
  it('ignores a late successful response after logout and never restores cleared storage', async () => {
    let finish: (value: FeedbackResult) => void = () => undefined;
    const engine = createFeedbackOutbox(
      'account',
      storage,
      () =>
        new Promise<FeedbackResult>((resolve) => {
          finish = resolve;
        }),
      () => now,
    );
    await engine.enqueue(entry());
    const pending = engine.flush();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await clearAuthFlows();
    engine.stop();
    await clearFeedbackStorage(storage);
    finish(result);
    await pending;
    expect(disk.size).toBe(0);
    expect(engine.outcome(entry().idempotencyKey)).toBeUndefined();
  });
  it('does not send if durable storage fails', async () => {
    const send = jest.fn(async () => result);
    const engine = createFeedbackOutbox(
      'account',
      {
        ...storage,
        setItem: async () => {
          throw new Error('Disk full');
        },
      },
      send,
      () => now,
    );
    await expect(engine.enqueue(entry())).rejects.toThrow('Disk full');
    expect(send).not.toHaveBeenCalled();
  });
});
