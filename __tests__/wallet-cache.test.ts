import { afterEach, expect, it, jest } from '@jest/globals';
import { createQueryClient, queryKeys } from '@/services/query';
import {
  clearWalletCache,
  createWalletCache,
  walletCachePrefix,
  type WalletCacheStorage,
} from '@/services/query/wallet-cache';
import { clearAuthFlows } from '@/lib/auth-lifecycle';
const balance = { balanceMinor: 1250, pendingMinor: 50, currency: 'AZN' };
const clients: ReturnType<typeof createQueryClient>[] = [];
const controllers: ReturnType<typeof createWalletCache>[] = [];
function setup(owner = 'account') {
  const entries = new Map<string, string>();
  const storage: WalletCacheStorage = {
    getItem: async (key) => entries.get(key) ?? null,
    setItem: async (key, value) => {
      entries.set(key, value);
    },
    getAllKeys: async () => [...entries.keys()],
    multiRemove: async (keys) => {
      keys.forEach((key) => entries.delete(key));
    },
  };
  const client = createQueryClient();
  clients.push(client);
  const cache = createWalletCache(client, storage, owner);
  controllers.push(cache);
  return { entries, storage, client, cache, key: walletCachePrefix + owner };
}
afterEach(() => {
  controllers.splice(0).forEach((cache) => cache.stop());
  clients.splice(0).forEach((client) => client.clear());
  jest.restoreAllMocks();
});
it('persists only validated wallet projections, with bounded history/records', async () => {
  const { client, cache, entries, key } = setup();
  client.setQueryData(queryKeys.wallet.summary(), balance);
  client.setQueryData(['user', 'profile'], { phone: 'private' });
  client.setQueryData(['receipt', 'private'], { token: 'private' });
  client.setQueryData(['wallet', 'unknown'], { token: 'private' });
  client.setQueryData(['wallet', 'history'], {
    pages: Array.from({ length: 8 }, () => ({
      items: [],
      nextCursor: 'cursor',
    })),
    pageParams: Array(8).fill(null),
  });
  await cache.start();
  const raw = entries.get(key)!;
  expect(raw).not.toContain('private');
  const saved = JSON.parse(raw);
  expect(saved.records).toHaveLength(2);
  expect(saved.records[1].data.pages).toHaveLength(3);
  for (let i = 0; i < 20; i++)
    client.setQueryData(['wallet', 'transactions', { cursor: String(i) }], {
      items: [],
      nextCursor: null,
    });
  await cache.persist();
  expect(JSON.parse(entries.get(key)!).records).toHaveLength(12);
});
it('hydrates missing values as stale and never overwrites newer network data', async () => {
  const { cache, client, entries, key } = setup();
  entries.set(
    key,
    JSON.stringify({
      version: 1,
      owner: 'account',
      records: [{ kind: 'summary', key: ['wallet', 'summary'], data: balance }],
    }),
  );
  await cache.start();
  expect(client.getQueryData(queryKeys.wallet.summary())).toEqual(balance);
  expect(client.getQueryState(queryKeys.wallet.summary())?.dataUpdatedAt).toBe(
    0,
  );
  cache.stop();
  client.setQueryData(queryKeys.wallet.summary(), {
    ...balance,
    balanceMinor: 4000,
  });
  const other = createWalletCache(
    client,
    {
      getItem: async () => entries.get(key)!,
      setItem: async () => {},
      getAllKeys: async () => [],
      multiRemove: async () => {},
    },
    'account',
  );
  controllers.push(other);
  await other.start();
  expect(client.getQueryData(queryKeys.wallet.summary())).toEqual({
    ...balance,
    balanceMinor: 4000,
  });
});
it.each([
  '{',
  JSON.stringify({ version: 1, owner: 'other', records: [] }),
  JSON.stringify({
    version: 1,
    owner: 'account',
    records: [
      {
        kind: 'summary',
        key: ['wallet', 'summary'],
        data: { ...balance, token: 'forbidden' },
      },
    ],
  }),
  'x'.repeat(250001),
])(
  'discards malformed, cross-account, expanded or oversized input',
  async (raw) => {
    const { entries, key, cache, client } = setup();
    entries.set(key, raw);
    await cache.start();
    expect(client.getQueryData(queryKeys.wallet.summary())).toBeUndefined();
  },
);
it('rejects mismatched transaction IDs and invalid owner IDs', async () => {
  const { client, cache, entries, key } = setup();
  client.setQueryData(['wallet', 'transaction', 'expected'], {
    id: 'other',
    type: 'earned',
    status: 'confirmed',
    amountMinor: 10,
    createdAt: '2026-11-01T00:00:00Z',
    source: null,
    receiptId: null,
    itemName: null,
  });
  await cache.start();
  expect(JSON.parse(entries.get(key)!).records).toEqual([]);
  const invalid = setup('../bad');
  await invalid.cache.start();
  expect(invalid.entries.size).toBe(0);
});
it('ignores late reads after stop or logout and removes only wallet storage', async () => {
  const { client, storage, cache, entries, key } = setup();
  let release: ((value: string | null) => void) | undefined;
  storage.getItem = () =>
    new Promise((resolve) => {
      release = resolve;
    });
  const pending = cache.start();
  await Promise.resolve();
  await Promise.resolve();
  cache.stop();
  release?.(
    JSON.stringify({
      version: 1,
      owner: 'account',
      records: [{ kind: 'summary', key: ['wallet', 'summary'], data: balance }],
    }),
  );
  await pending;
  expect(client.getQueryData(queryKeys.wallet.summary())).toBeUndefined();
  entries.set(key, 'old');
  entries.set(walletCachePrefix + 'other', 'old');
  entries.set('unrelated', 'keep');
  const late = createWalletCache(client, storage, 'account');
  controllers.push(late);
  await clearAuthFlows();
  await late.persist();
  await clearWalletCache(storage);
  expect([...entries]).toEqual([['unrelated', 'keep']]);
});
it('debounces successful writes and stops pending timers', async () => {
  const { cache, client, entries, key } = setup();
  await cache.start();
  client.setQueryData(queryKeys.wallet.summary(), balance);
  await new Promise((resolve) => setTimeout(resolve, 300));
  expect(entries.get(key)).toContain('1250');
  cache.stop();
  client.setQueryData(queryKeys.wallet.summary(), {
    ...balance,
    balanceMinor: 9000,
  });
  await cache.persist();
  expect(entries.get(key)).not.toContain('9000');
});
