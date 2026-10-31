import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  useWalletHistory,
  useWalletTransaction,
  walletHistoryKey,
} from '@/hooks/useWalletHistory';
import { groupWalletHistory } from '@/lib/wallet-history';
import { createQueryClient } from '@/services/query';
import { mockTransactions } from '@/services/mock/fixtures';
import type { Paginated, WalletTransaction } from '@/services/contracts';
const mockList =
  jest.fn<
    (params?: {
      cursor?: string;
      limit?: number;
    }) => Promise<Paginated<WalletTransaction>>
  >();
const mockDetail = jest.fn<(id: string) => Promise<WalletTransaction>>();
jest.mock('@/services', () => ({
  ...jest.requireActual<object>('@/services/contracts'),
  services: {
    wallet: {
      transactions: (params: { cursor?: string }) => mockList(params),
      transaction: (id: string) => mockDetail(id),
    },
  },
}));
const client = createQueryClient();
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);
beforeEach(() => {
  client.clear();
  mockList.mockReset();
  mockDetail.mockReset();
});
afterEach(() => client.clear());
it('deduplicates cursor pages and stops a repeated cursor', async () => {
  const a = mockTransactions[0]!;
  const b = mockTransactions[1]!;
  mockList
    .mockResolvedValueOnce({ items: [a], nextCursor: 'next' })
    .mockResolvedValueOnce({ items: [a, b], nextCursor: 'next' });
  const hook = await renderHook(useWalletHistory, { wrapper });
  await waitFor(() => expect(hook.result.current.data?.items).toHaveLength(1));
  await act(async () => {
    await hook.result.current.fetchNextPage();
  });
  await waitFor(() => expect(hook.result.current.data?.items).toHaveLength(2));
  expect(hook.result.current.hasNextPage).toBe(false);
  expect(mockList).toHaveBeenNthCalledWith(2, { cursor: 'next', limit: 20 });
});
it('shows a cached transaction instantly and keeps it on a failed refresh', async () => {
  const transaction = mockTransactions[0]!;
  client.setQueryData(walletHistoryKey, {
    pages: [{ items: [transaction], nextCursor: null }],
    pageParams: [undefined],
  });
  mockDetail.mockRejectedValue(new Error('Offline'));
  const hook = await renderHook(() => useWalletTransaction(transaction.id), {
    wrapper,
  });
  expect(hook.result.current.data).toEqual(transaction);
  await waitFor(() => expect(hook.result.current.isError).toBe(true));
  expect(hook.result.current.data).toEqual(transaction);
});
it('blocks malformed IDs even when an explicit retry bypasses enabled', async () => {
  const hook = await renderHook(
    () => useWalletTransaction('../private?secret=x'),
    { wrapper },
  );
  await act(async () => {
    await hook.result.current.refetch();
  });
  expect(mockDetail).not.toHaveBeenCalled();
});
it('groups device-local calendar days without modifying financial values', () => {
  const today = new Date(2026, 9, 31, 12);
  const transaction = mockTransactions[0]!;
  const list = [
    {
      ...transaction,
      id: 'yesterday',
      createdAt: new Date(2026, 9, 30, 23).toISOString(),
    },
    {
      ...transaction,
      id: 'today',
      amountMinor: -123,
      createdAt: today.toISOString(),
    },
  ];
  const grouped = groupWalletHistory(list, 'en', today);
  expect(grouped.rows[0]).toMatchObject({ kind: 'date', label: 'Today' });
  expect(grouped.rows[2]).toMatchObject({ kind: 'date', label: 'Yesterday' });
  expect(grouped.rows[1]).toMatchObject({
    transaction: { id: 'today', amountMinor: -123 },
  });
  expect(grouped.stickyHeaderIndices).toEqual([0, 2]);
});
