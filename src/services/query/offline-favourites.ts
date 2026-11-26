/**
 * Offline favourites: a versioned, per-account, size-bounded copy of the liked
 * restaurants (list, detail, menu with dishes, reviews already seen) plus the
 * likes made without a network. Only content the app actually received is kept.
 */
import {
  hashKey,
  type InfiniteData,
  type QueryClient,
} from '@tanstack/react-query';
import { z } from 'zod';
import { authOperation } from '@/lib/auth-lifecycle';
import { safeIdSchema } from '@/lib/deep-link';
import {
  likeItemSchema,
  likeKindSchema,
  likeSnapshotSchema,
  likeTargetIdSchema,
  restaurantSchema,
  type LikeItem,
  type LikeKind,
  type LikeSnapshot,
  type Paginated,
} from '../contracts';
import {
  catalogSchema,
  reviewListSchema,
} from '../contracts/restaurant-catalog';
import { isApiError } from '../http/errors';
import { queryKeys } from '.';
import type { WalletCacheStorage } from './wallet-cache';

export const offlinePrefix = 'epsilon.offline.';
export const MAX_FAVOURITES = 20;
const MAX_QUEUE = 100;
const MAX_MEMORY = 200;
/** Android reads at most about 2 MB per AsyncStorage row; characters may be 2-3 bytes. */
export const MAX_SNAPSHOT_CHARS = 600_000;

const language = z.enum(['az', 'en', 'ru']);
const recordSchema = z.union([
  z
    .object({
      key: z.tuple([
        z.literal('restaurant'),
        z.literal('detail'),
        safeIdSchema,
      ]),
      data: restaurantSchema,
    })
    .strict(),
  z
    .object({
      key: z.tuple([
        z.literal('restaurant'),
        z.literal('catalog'),
        safeIdSchema,
        language,
      ]),
      data: catalogSchema,
    })
    .strict(),
  z
    .object({
      key: z.tuple([
        z.literal('restaurant'),
        z.literal('reviews'),
        safeIdSchema,
        safeIdSchema,
        language,
      ]),
      data: reviewListSchema,
    })
    .strict(),
]);
type CacheRecord = z.infer<typeof recordSchema>;
const queuedSchema = z
  .object({
    kind: likeKindSchema,
    targetId: likeTargetIdSchema,
    liked: z.boolean(),
    snapshot: likeSnapshotSchema,
  })
  .strict();
export type QueuedLike = z.infer<typeof queuedSchema>;
const snapshotSchema = z
  .object({
    version: z.literal(1),
    owner: safeIdSchema,
    favourites: z.array(likeItemSchema).max(MAX_FAVOURITES),
    records: z.array(recordSchema),
    queue: z.array(queuedSchema).max(MAX_QUEUE),
  })
  .strict();

type Lists = InfiniteData<Paginated<LikeItem>, string | undefined>;
const listKey = queryKeys.likes.list('restaurant');

let diskQueue: Promise<unknown> = Promise.resolve();
function serial<T>(task: () => Promise<T>): Promise<T> {
  const next = diskQueue.catch(() => undefined).then(task);
  diskQueue = next;
  return next;
}
export function clearOfflineFavourites(storage: WalletCacheStorage) {
  return serial(async () =>
    storage.multiRemove(
      (await storage.getAllKeys()).filter((key) =>
        key.startsWith(offlinePrefix),
      ),
    ),
  );
}

const controllers = new WeakMap<QueryClient, OfflineFavourites>();
/** The signed-in account's offline copy, when one is running. */
export const offlineFavourites = (client: QueryClient) =>
  controllers.get(client);
export type OfflineFavourites = ReturnType<typeof createOfflineFavourites>;

export function createOfflineFavourites(
  client: QueryClient,
  storage: WalletCacheStorage,
  owner: string,
  /** A restaurant became a favourite: its content can now be fetched. */
  onNewFavourite: () => void = () => {},
) {
  const epoch = authOperation.epoch();
  let active = true;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let unsubscribe = () => {};
  let flushing: Promise<boolean> | undefined;
  let favourites: LikeItem[] = [];
  const records = new Map<string, CacheRecord>();
  const queue = new Map<string, QueuedLike>();
  const current = () =>
    active &&
    authOperation.current(epoch) &&
    safeIdSchema.safeParse(owner).success;
  const storageKey = offlinePrefix + owner;
  const queueKey = (kind: LikeKind, targetId: string) => `${kind}/${targetId}`;
  let loaded: () => void = () => {};
  const ready = new Promise<void>((resolve) => {
    loaded = resolve;
  });

  const persist = async () => {
    // Never overwrite the saved copy before it has been read.
    await ready;
    await serial(async () => {
      if (!current()) return;
      const kept: CacheRecord[] = [];
      const text = () =>
        JSON.stringify({
          version: 1,
          owner,
          favourites,
          records: kept,
          queue: [...queue.values()],
        });
      let size = text().length;
      // Most recently liked restaurants first; what does not fit stays online only.
      for (const favourite of favourites)
        for (const record of records.values()) {
          if (record.key[2] !== favourite.restaurantId) continue;
          const length = JSON.stringify(record).length + 1;
          if (size + length > MAX_SNAPSHOT_CHARS) continue;
          size += length;
          kept.push(record);
        }
      await storage.setItem(storageKey, text());
    });
  };
  const schedule = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      void persist().catch(() => undefined);
    }, 250);
  };
  /** Returns true when the query is one this copy keeps. */
  const capture = (key: readonly unknown[], data: unknown) => {
    if (key[0] === 'likes' && key[1] === 'list' && key[2] === 'restaurant') {
      const items = (data as Lists | undefined)?.pages.flatMap((p) => p.items);
      if (!items) return false;
      const next = items.slice(0, MAX_FAVOURITES).flatMap((item) => {
        const parsed = likeItemSchema.safeParse(item);
        return parsed.success ? [parsed.data] : [];
      });
      const added = next.some(
        (item) => !favourites.some((f) => f.targetId === item.targetId),
      );
      favourites = next;
      if (added) onNewFavourite();
      return true;
    }
    if (key[0] !== 'restaurant') return false;
    const record = recordSchema.safeParse({ key, data });
    if (!record.success) return false;
    const id = hashKey(key);
    records.delete(id);
    records.set(id, record.data);
    if (records.size > MAX_MEMORY) records.delete(records.keys().next().value!);
    return true;
  };
  /** Shows a like change that the server has not seen yet. */
  const applyQueued = (op: QueuedLike) => {
    const key = queryKeys.likes.state(op.kind, op.targetId);
    const previous = client.getQueryData<{ liked: boolean; count: number }>(
      key,
    );
    if (previous?.liked !== op.liked)
      client.setQueryData(key, {
        liked: op.liked,
        count: Math.max(0, (previous?.count ?? 0) + (op.liked ? 1 : -1)),
      });
    if (op.kind !== 'restaurant') return;
    const data = client.getQueryData<Lists>(listKey);
    const pages = data?.pages ?? [{ items: [], nextCursor: null }];
    const others = pages.map((page) => ({
      ...page,
      items: page.items.filter((item) => item.targetId !== op.targetId),
    }));
    if (op.liked)
      others[0]!.items.unshift({
        ...op.snapshot,
        kind: op.kind,
        targetId: op.targetId,
        createdAt: new Date().toISOString(),
        count: 1,
      });
    client.setQueryData<Lists>(listKey, {
      pages: others,
      pageParams: data?.pageParams ?? [undefined],
    });
  };

  const controller = {
    async start() {
      if (!current()) return;
      // Saved content must outlive the default five-minute garbage collection.
      for (const queryKey of [
        ['restaurant', 'detail'],
        ['restaurant', 'catalog'],
        ['restaurant', 'reviews'],
        listKey,
      ])
        client.setQueryDefaults(queryKey, { gcTime: Infinity });
      let saved: z.infer<typeof snapshotSchema> | undefined;
      try {
        const raw = await serial(() => storage.getItem(storageKey));
        if (raw && raw.length <= MAX_SNAPSHOT_CHARS * 1.5)
          saved = snapshotSchema.safeParse(JSON.parse(raw)).data;
      } catch {
        /* Unreadable or untrusted local data is discarded. */
      }
      if (!current()) return loaded();
      if (saved?.owner === owner) {
        favourites = saved.favourites;
        for (const record of saved.records) {
          records.set(hashKey(record.key), record);
          if (client.getQueryData(record.key) === undefined)
            client.setQueryData(record.key, record.data, { updatedAt: 0 });
        }
        if (favourites.length && client.getQueryData(listKey) === undefined)
          client.setQueryData<Lists>(
            listKey,
            {
              pages: [{ items: favourites, nextCursor: null }],
              pageParams: [undefined],
            },
            { updatedAt: 0 },
          );
        for (const item of favourites) {
          const key = queryKeys.likes.state(item.kind, item.targetId);
          if (client.getQueryData(key) === undefined)
            client.setQueryData(
              key,
              { liked: true, count: item.count },
              { updatedAt: 0 },
            );
        }
        for (const op of saved.queue) {
          const id = queueKey(op.kind, op.targetId);
          if (!queue.has(id)) queue.set(id, op);
        }
      }
      // What screens fetched before this copy started.
      for (const query of client.getQueryCache().getAll())
        if (query.state.data !== undefined && query.state.dataUpdatedAt > 0)
          capture(query.queryKey, query.state.data);
      unsubscribe = client.getQueryCache().subscribe((event) => {
        if (
          event.type === 'updated' &&
          event.action.type === 'success' &&
          capture(event.query.queryKey, event.query.state.data)
        )
          schedule();
      });
      for (const op of queue.values()) applyQueued(op);
      loaded();
      await persist();
    },
    favouriteIds: () => favourites.map((item) => item.restaurantId),
    pending: () => [...queue.values()],
    /** Keeps the latest wish per target; resolves once it is on disk. */
    async enqueue(op: QueuedLike) {
      const id = queueKey(op.kind, op.targetId);
      const parsed = queuedSchema.parse(op);
      queue.delete(id);
      if (queue.size >= MAX_QUEUE)
        throw new Error('Offline like queue is full');
      queue.set(id, parsed);
      applyQueued(parsed);
      await persist();
    },
    /** A newer change reached the server directly: the queued one is obsolete. */
    forget(kind: LikeKind, targetId: string) {
      if (queue.delete(queueKey(kind, targetId))) schedule();
    },
    /** Replays queued likes in order. True when the server accepted or refused any. */
    flush(
      send: (
        kind: LikeKind,
        targetId: string,
        liked: boolean,
        snapshot: LikeSnapshot,
      ) => Promise<unknown>,
    ) {
      flushing ??= (async () => {
        await ready;
        let settled = false;
        for (const [id, op] of [...queue]) {
          if (!current()) break;
          if (queue.get(id) !== op) continue;
          try {
            await send(op.kind, op.targetId, op.liked, op.snapshot);
          } catch (error) {
            // Only a definite refusal drops the change; anything else waits.
            const refused =
              isApiError(error) &&
              error.status >= 400 &&
              error.status < 500 &&
              error.status !== 401 &&
              error.status !== 429;
            if (!refused) break;
          }
          if (queue.get(id) === op) queue.delete(id);
          settled = true;
        }
        if (settled) await persist();
        return settled;
      })().finally(() => {
        flushing = undefined;
      });
      return flushing;
    },
    persist,
    stop() {
      active = false;
      if (timer) clearTimeout(timer);
      unsubscribe();
      loaded();
      if (controllers.get(client) === controller) controllers.delete(client);
    },
  };
  controllers.set(client, controller);
  return controller;
}
