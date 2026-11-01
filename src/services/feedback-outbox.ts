import { z } from 'zod';
import { authOperation } from '@/lib/auth-lifecycle';
import { trustedServerTime } from '@/lib/server-clock';
import { feedbackInputSchema, type FeedbackResult } from './contracts';
import { isApiError } from './http/errors';

export const feedbackOutboxPrefix = 'epsilon.feedback.outbox.';
export const outboxEntrySchema = feedbackInputSchema
  .extend({
    receiptId: z.string().min(1),
    idempotencyKey: z.string().min(1),
    createdAt: z.number().int().safe().nonnegative().nullable(),
  })
  .strict();
export type OutboxEntry = z.infer<typeof outboxEntrySchema>;
export type OutboxOutcome = { entry: OutboxEntry } & (
  { kind: 'sent'; result: FeedbackResult } | { kind: 'duplicate' | 'invalid' }
);
export type OutboxStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  getAllKeys: () => Promise<readonly string[]>;
  multiRemove: (keys: readonly string[]) => Promise<void>;
};
let diskQueue: Promise<unknown> = Promise.resolve();
function serial<T>(task: () => Promise<T>): Promise<T> {
  const next = diskQueue.catch(() => undefined).then(task);
  diskQueue = next;
  return next;
}
export function clearFeedbackStorage(storage: OutboxStorage) {
  return serial(async () => {
    const keys = (await storage.getAllKeys()).filter((key) =>
      key.startsWith(feedbackOutboxPrefix),
    );
    await storage.multiRemove(keys);
  });
}
const MAX_AGE = 7 * 24 * 60 * 60 * 1000;
export class OutboxFullError extends Error {}

/** Durable payload/key pairs; no wallet values, claim references, tokens or provider data. */
export function createFeedbackOutbox(
  owner: string,
  storage: OutboxStorage,
  send: (entry: OutboxEntry, signal: AbortSignal) => Promise<FeedbackResult>,
  now: () => number | null = trustedServerTime,
) {
  const key = feedbackOutboxPrefix + owner;
  const epoch = authOperation.epoch();
  let active = true;
  let entries: readonly OutboxEntry[] = [];
  let loaded = false;
  let running: Promise<void> | null = null;
  const listeners = new Set<() => void>();
  const results = new Map<string, OutboxOutcome>();
  const outcomes = new Set<(outcome: OutboxOutcome) => void>();
  let controller = new AbortController();
  let generation = 0;
  const current = () => active && authOperation.current(epoch);
  const notify = () => listeners.forEach((listener) => listener());
  const read = async () => {
    const raw = await storage.getItem(key);
    if (!raw) return [];
    let values: unknown;
    try {
      values = JSON.parse(raw);
    } catch {
      return [];
    }
    if (!Array.isArray(values)) return [];
    return values
      .flatMap((value: unknown) => {
        const parsed = outboxEntrySchema.safeParse(value);
        const instant = now();
        if (!parsed.success) return [];
        const createdAt = parsed.data.createdAt;
        // Without a server anchor, retain bounded drafts instead of guessing
        // their age from the device date. Start the TTL at first trusted time.
        if (createdAt === null)
          return [
            {
              ...parsed.data,
              createdAt: instant === null ? null : Math.floor(instant),
            },
          ];
        return instant === null ||
          (instant - createdAt <= MAX_AGE && createdAt <= instant)
          ? [parsed.data]
          : [];
      })
      .slice(0, 20);
  };
  const write = async (next: readonly OutboxEntry[]) => {
    if (!current()) return;
    if (next.length) await storage.setItem(key, JSON.stringify(next));
    else await storage.removeItem(key);
    if (current()) {
      entries = next;
      loaded = true;
      notify();
    }
  };
  const load = () =>
    serial(async () => {
      if (current() && !loaded) await write(await read());
    });
  const remove = (idempotencyKey: string, valid: () => boolean) =>
    serial(async () => {
      const saved = await read();
      if (valid())
        await write(
          saved.filter((entry) => entry.idempotencyKey !== idempotencyKey),
        );
    });
  const engine = {
    snapshot: () => entries,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    onOutcome(listener: (outcome: OutboxOutcome) => void) {
      outcomes.add(listener);
      return () => {
        outcomes.delete(listener);
      };
    },
    outcome: (idempotencyKey: string) => results.get(idempotencyKey),
    load,
    async enqueue(input: OutboxEntry) {
      const entry = outboxEntrySchema.parse(input);
      await serial(async () => {
        if (!current()) throw new Error('Session unavailable');
        const saved = await read();
        if (saved.some((item) => item.receiptItemId === entry.receiptItemId)) {
          await write(saved);
          return;
        }
        if (saved.length >= 20)
          throw new OutboxFullError('Feedback queue is full');
        await write([...saved, entry]);
      });
    },
    flush() {
      if (running) return running;
      const version = generation;
      const request = controller;
      const valid = () => current() && version === generation;
      running = (async () => {
        await serial(async () => {
          if (valid()) await write(await read());
        });
        while (valid() && entries.length) {
          const entry = entries[0];
          if (!entry) break;
          let outcome: OutboxOutcome;
          try {
            const result = await send(entry, request.signal);
            if (!valid()) return;
            outcome = { kind: 'sent', entry, result };
          } catch (error) {
            if (!valid()) return;
            if (
              isApiError(error) &&
              error.code === 'FEEDBACK_ALREADY_SUBMITTED'
            )
              outcome = { kind: 'duplicate', entry };
            else if (isApiError(error) && error.code === 'VALIDATION_FAILED')
              outcome = { kind: 'invalid', entry };
            else return; // Ambiguous outcomes retain the exact durable payload/key for retry.
          }
          await remove(entry.idempotencyKey, valid);
          if (!valid()) return;
          results.set(entry.idempotencyKey, outcome);
          if (results.size > 20)
            results.delete(results.keys().next().value ?? '');
          outcomes.forEach((listener) => listener(outcome));
        }
      })().finally(() => {
        running = null;
      });
      return running;
    },
    start() {
      active = true;
      controller = new AbortController();
      return load();
    },
    stop() {
      generation += 1;
      active = false;
      controller.abort();
      entries = [];
      loaded = false;
      results.clear();
      notify();
    },
  };
  return engine;
}
export type FeedbackOutbox = ReturnType<typeof createFeedbackOutbox>;
