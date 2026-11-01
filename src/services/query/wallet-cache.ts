import { z } from 'zod';
import type { QueryClient } from '@tanstack/react-query';
import { authOperation } from '@/lib/auth-lifecycle';
import { safeIdSchema } from '@/lib/deep-link';
import { walletSchema, walletTransactionSchema } from '../contracts';
export const walletCachePrefix = 'epsilon.wallet-cache.';
const page = z
  .object({
    items: z.array(walletTransactionSchema).max(50),
    nextCursor: z.string().max(256).nullable(),
  })
  .strict();
const params = z
  .object({
    limit: z.number().int().min(1).max(50).optional(),
    cursor: z.string().max(256).optional(),
  })
  .strict();
const recordSchema = z.discriminatedUnion('kind', [
  z
    .object({
      kind: z.literal('summary'),
      key: z.tuple([z.literal('wallet'), z.literal('summary')]),
      data: walletSchema,
    })
    .strict(),
  z
    .object({
      kind: z.literal('transactions'),
      key: z.tuple([z.literal('wallet'), z.literal('transactions'), params]),
      data: page,
    })
    .strict(),
  z
    .object({
      kind: z.literal('transaction'),
      key: z.tuple([
        z.literal('wallet'),
        z.literal('transaction'),
        safeIdSchema,
      ]),
      data: walletTransactionSchema,
    })
    .strict()
    .refine((record) => record.key[2] === record.data.id),
  z
    .object({
      kind: z.literal('history'),
      key: z.tuple([z.literal('wallet'), z.literal('history')]),
      data: z
        .object({
          pages: z.array(page).min(1).max(3),
          pageParams: z.array(z.string().max(256).nullish()).min(1).max(3),
        })
        .strict()
        .refine((data) => data.pages.length === data.pageParams.length),
    })
    .strict(),
]);
const snapshotSchema = z
  .object({
    version: z.literal(1),
    owner: safeIdSchema,
    records: z.array(recordSchema).max(12),
  })
  .strict();
export type WalletCacheStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  getAllKeys: () => Promise<readonly string[]>;
  multiRemove: (keys: readonly string[]) => Promise<void>;
};
let diskQueue: Promise<unknown> = Promise.resolve();
function serial<T>(task: () => Promise<T>): Promise<T> {
  const next = diskQueue.catch(() => undefined).then(task);
  diskQueue = next;
  return next;
}
export function clearWalletCache(storage: WalletCacheStorage) {
  return serial(async () =>
    storage.multiRemove(
      (await storage.getAllKeys()).filter((key) =>
        key.startsWith(walletCachePrefix),
      ),
    ),
  );
}
/** Only validated wallet projections persist; never auth, profile, receipt, comment or config queries. */
export function createWalletCache(
  client: QueryClient,
  storage: WalletCacheStorage,
  owner: string,
) {
  const epoch = authOperation.epoch();
  let active = true;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let unsubscribe = () => {};
  const current = () =>
    active &&
    authOperation.current(epoch) &&
    safeIdSchema.safeParse(owner).success;
  const key = walletCachePrefix + owner;
  const persist = () =>
    serial(async () => {
      if (!current()) return;
      const records = client
        .getQueryCache()
        .findAll({ queryKey: ['wallet'] })
        .flatMap((query) => {
          let data: unknown = query.state.data;
          if (
            query.queryKey[1] === 'history' &&
            data &&
            typeof data === 'object' &&
            'pages' in data &&
            'pageParams' in data &&
            Array.isArray(data.pages) &&
            Array.isArray(data.pageParams)
          )
            data = {
              pages: data.pages.slice(0, 3),
              pageParams: data.pageParams.slice(0, 3),
            };
          const record = recordSchema.safeParse({
            kind: query.queryKey[1],
            key: query.queryKey,
            data,
          });
          return record.success ? [record.data] : [];
        })
        .slice(0, 12);
      const text = JSON.stringify({ version: 1, owner, records });
      if (text.length <= 250_000 && current()) await storage.setItem(key, text);
    });
  return {
    async start() {
      if (!current()) return;
      const raw = await serial(() => storage.getItem(key));
      if (!current()) return;
      if (raw && raw.length <= 250_000) {
        let parsed: z.infer<typeof snapshotSchema> | undefined;
        try {
          parsed = snapshotSchema.parse(JSON.parse(raw));
        } catch {
          /* Untrusted local cache is discarded. */
        }
        if (parsed?.owner === owner)
          for (const record of parsed.records) {
            if (client.getQueryData(record.key) === undefined)
              client.setQueryData(record.key, record.data, { updatedAt: 0 });
          }
      }
      if (!current()) return;
      unsubscribe = client.getQueryCache().subscribe((event) => {
        if (
          event.type !== 'updated' ||
          event.action.type !== 'success' ||
          event.query.queryKey[0] !== 'wallet'
        )
          return;
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          void persist().catch(() => undefined);
        }, 250);
      });
      await persist();
    },
    persist,
    stop() {
      active = false;
      if (timer) clearTimeout(timer);
      unsubscribe();
    },
  };
}
