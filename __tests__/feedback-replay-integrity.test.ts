import { expect, it, jest } from '@jest/globals';
import { ApiError } from '@/services/http/errors';
import {
  createFeedbackOutbox,
  type OutboxEntry,
  type OutboxStorage,
} from '@/services/feedback-outbox';
import {
  createQueryClient,
  queryInvalidations,
  queryKeys,
} from '@/services/query';
import type { FeedbackResult } from '@/services/contracts';

it('replays a server-committed lost response with the same key and refreshes the universal wallet projection', async () => {
  const disk = new Map<string, string>();
  const storage: OutboxStorage = {
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
  const entry: OutboxEntry = {
    receiptId: 'receipt',
    receiptItemId: 'dish',
    rating: 5,
    reasonCodes: [],
    idempotencyKey: 'stable-replay-key',
    createdAt: 1800000000000,
  };
  const ledger = new Map<string, FeedbackResult>();
  let loseResponse = true;
  const send = jest.fn(async (value: OutboxEntry) => {
    if (!ledger.has(value.idempotencyKey))
      ledger.set(value.idempotencyKey, {
        feedbackId: 'server-feedback',
        reward: { status: 'confirmed', amountMinor: 250 },
      });
    if (loseResponse) {
      loseResponse = false;
      throw new ApiError({
        code: 'NETWORK',
        message: 'Lost response',
        status: 0,
      });
    }
    return ledger.get(value.idempotencyKey)!;
  });
  const client = createQueryClient();
  const fetchWallet = () =>
    client.fetchQuery({
      queryKey: queryKeys.wallet.summary(),
      queryFn: async () => ({ balanceMinor: ledger.size ? 3700 : 3450 }),
    });
  expect(await fetchWallet()).toEqual({ balanceMinor: 3450 });
  const first = createFeedbackOutbox(
    'account',
    storage,
    send,
    () => entry.createdAt,
  );
  await first.enqueue(entry);
  await first.flush();
  first.stop();
  expect(disk.size).toBe(1);
  const restarted = createFeedbackOutbox(
    'account',
    storage,
    send,
    () => entry.createdAt,
  );
  let invalidation: Promise<void> | undefined;
  restarted.onOutcome(() => {
    invalidation = queryInvalidations.onFeedbackSubmitted(client);
  });
  await restarted.flush();
  await invalidation;
  expect(ledger.size).toBe(1);
  expect(send.mock.calls.map(([value]) => value.idempotencyKey)).toEqual([
    'stable-replay-key',
    'stable-replay-key',
  ]);
  expect(await fetchWallet()).toEqual({ balanceMinor: 3700 });
  expect(restarted.snapshot()).toEqual([]);
  expect(disk.size).toBe(0);
  restarted.stop();
  client.clear();
});
