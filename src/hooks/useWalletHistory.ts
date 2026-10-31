import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { safeIdSchema } from '@/lib/deep-link';
import {
  services,
  walletTransactionSchema,
  type WalletTransaction,
} from '@/services';
import { queryKeys } from '@/services/query';

export const walletHistoryKey = [...queryKeys.wallet.all, 'history'] as const;
export function useWalletHistory() {
  return useInfiniteQuery({
    queryKey: walletHistoryKey,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) =>
      services.wallet.transactions(
        { cursor: pageParam, limit: 20 },
        { signal },
      ),
    getNextPageParam: (last, _pages, current, cursors) =>
      last.nextCursor &&
      last.nextCursor !== current &&
      !cursors.includes(last.nextCursor)
        ? last.nextCursor
        : undefined,
    select: (data) => ({
      ...data,
      items: [
        ...new Map(
          data.pages
            .flatMap((page) => page.items)
            .map((item) => [item.id, item]),
        ).values(),
      ],
    }),
  });
}
function cachedTransaction(
  value: unknown,
  id: string,
): WalletTransaction | undefined {
  const parsed = walletTransactionSchema.safeParse(value);
  if (parsed.success && parsed.data.id === id) return parsed.data;
  if (!value || typeof value !== 'object') return;
  if ('pages' in value && Array.isArray(value.pages)) {
    for (const page of value.pages) {
      const found = cachedTransaction(page, id);
      if (found) return found;
    }
  }
  if ('items' in value && Array.isArray(value.items)) {
    for (const item of value.items) {
      const found = cachedTransaction(item, id);
      if (found) return found;
    }
  }
}
export function useWalletTransaction(id: string) {
  const client = useQueryClient();
  return useQuery({
    queryKey: queryKeys.wallet.transaction(id),
    enabled: safeIdSchema.safeParse(id).success,
    queryFn: ({ signal }) =>
      services.wallet.transaction(safeIdSchema.parse(id), { signal }),
    initialData: () =>
      client
        .getQueriesData({ queryKey: queryKeys.wallet.all })
        .flatMap(([, data]) => {
          const found = cachedTransaction(data, id);
          return found ? [found] : [];
        })[0],
    initialDataUpdatedAt: 0,
  });
}
