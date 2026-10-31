import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { InfiniteQueryObserver } from '@tanstack/react-query';
import { createQueryClient } from '@/services/query';
import { walletOptions, walletTransactionsOptions } from '@/hooks/useWallet';
import { restaurantOptions } from '@/features/restaurants/hooks/useRestaurants';
import {
  mockRestaurants,
  mockTransactions,
  mockWallet,
} from '@/services/mock/fixtures';

const mockGetWallet = jest.fn(
  async (_options?: { signal?: AbortSignal }) => mockWallet,
);
const mockTransactionsList = jest.fn(
  async (
    _params?: { limit?: number },
    _options?: { signal?: AbortSignal },
  ) => ({ items: mockTransactions, nextCursor: null }),
);
const mockList =
  jest.fn<
    (
      params?: { search?: string; cursor?: string; limit?: number },
      options?: { signal?: AbortSignal },
    ) => Promise<{ items: typeof mockRestaurants; nextCursor: string | null }>
  >();
jest.mock('@/services', () => ({
  services: {
    wallet: {
      get: (options?: { signal?: AbortSignal }) => mockGetWallet(options),
      transactions: (
        params?: { limit?: number },
        options?: { signal?: AbortSignal },
      ) => mockTransactionsList(params, options),
    },
    restaurant: {
      list: (
        params?: { search?: string; cursor?: string; limit?: number },
        options?: { signal?: AbortSignal },
      ) => mockList(params, options),
    },
  },
}));
const client = createQueryClient();
beforeEach(() => {
  jest.clearAllMocks();
  client.clear();
  mockList.mockReset();
});
afterEach(() => client.clear());

it('shares fresh server wallet data and includes the requested recent-activity limit', async () => {
  expect(await client.fetchQuery(walletOptions())).toEqual(mockWallet);
  await client.fetchQuery(walletOptions());
  expect(mockGetWallet).toHaveBeenCalledTimes(1);
  await client.fetchQuery(walletTransactionsOptions({ limit: 3 }));
  expect(mockTransactionsList).toHaveBeenCalledWith(
    { limit: 3 },
    { signal: expect.any(AbortSignal) },
  );
});
it('paginates with server cursors and separates different searches', async () => {
  mockList
    .mockResolvedValueOnce({
      items: [mockRestaurants[0]!],
      nextCursor: 'next-page',
    })
    .mockResolvedValueOnce({ items: [mockRestaurants[1]!], nextCursor: null })
    .mockResolvedValueOnce({ items: [], nextCursor: null });
  const observer = new InfiniteQueryObserver(
    client,
    restaurantOptions('Demo', 1),
  );
  const unsubscribe = observer.subscribe(() => {});
  await observer.refetch();
  await observer.fetchNextPage();
  expect(
    observer.getCurrentResult().data?.pages.flatMap((page) => page.items),
  ).toHaveLength(2);
  expect(mockList).toHaveBeenNthCalledWith(
    2,
    { search: 'Demo', limit: 1, cursor: 'next-page' },
    { signal: expect.any(AbortSignal) },
  );
  expect(observer.getCurrentResult().hasNextPage).toBe(false);
  await client.fetchInfiniteQuery(restaurantOptions('Absent', 1));
  expect(
    client.getQueryData(restaurantOptions('Demo', 1).queryKey),
  ).toBeDefined();
  unsubscribe();
});
it('stops a repeated server cursor rather than requesting pages forever', async () => {
  mockList.mockResolvedValue({ items: [], nextCursor: 'repeat' });
  const observer = new InfiniteQueryObserver(client, restaurantOptions('', 1));
  const unsubscribe = observer.subscribe(() => {});
  await observer.refetch();
  await observer.fetchNextPage();
  expect(observer.getCurrentResult().hasNextPage).toBe(false);
  unsubscribe();
});
it('preserves cached wallet data when a foreground refresh fails', async () => {
  await client.fetchQuery(walletOptions());
  mockGetWallet.mockRejectedValueOnce(new Error('offline'));
  await expect(
    client.fetchQuery({ ...walletOptions(), staleTime: 0 }),
  ).rejects.toThrow('offline');
  expect(client.getQueryData(walletOptions().queryKey)).toEqual(mockWallet);
});
