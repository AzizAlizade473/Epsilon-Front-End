import { useCallback, useSyncExternalStore } from 'react';
import {
  notifyManager,
  useInfiniteQuery,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { safeIdSchema } from '@/lib/deep-link';
import { services, type Receipt, type ReceiptListParams } from '@/services';
import { queryKeys } from '@/services/query';

const safeIds = (ids: readonly unknown[]) =>
  [...new Set(ids)].filter(
    (id): id is string =>
      typeof id === 'string' && safeIdSchema.safeParse(id).success,
  );

function useReceiptDetails(ids: readonly string[]) {
  const queries = useQueries({
    queries: ids.map((id) => ({
      queryKey: queryKeys.receipt.detail(id),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        services.receipt.get(id, { signal }),
    })),
  });
  return {
    receipts: [
      ...new Map(
        queries
          .flatMap((query) => (query.data ? [query.data] : []))
          .map((receipt) => [receipt.id, receipt]),
      ).values(),
    ],
    isPending: queries.some((query) => query.isPending),
    isError: queries.some((query) => query.isError),
    isFetching: queries.some((query) => query.isFetching),
    refetch: () => Promise.all(queries.map((query) => query.refetch())),
  };
}

/** The account's complete bill history, searched and filtered by the server. */
export function useBills(params: ReceiptListParams) {
  const list = useInfiniteQuery({
    queryKey: [...queryKeys.receipt.list, 'search', params],
    refetchOnMount: 'always',
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) =>
      services.receipt.list(
        { ...params, limit: 20, ...(pageParam ? { cursor: pageParam } : {}) },
        { signal },
      ),
    getNextPageParam: (last, _pages, current, cursors) =>
      last.nextCursor &&
      last.nextCursor !== current &&
      !cursors.includes(last.nextCursor)
        ? last.nextCursor
        : undefined,
  });
  const details = useReceiptDetails(
    safeIds(
      list.data?.pages.flatMap((page) => page.items.map((item) => item.id)) ??
        [],
    ),
  );
  return {
    /** Server order, so later pages only ever append. */
    receipts: details.receipts,
    isPending: list.isPending || details.isPending,
    isError: list.isError || details.isError,
    isRefetching: list.isRefetching,
    hasNextPage: list.hasNextPage,
    isFetchingNextPage: list.isFetchingNextPage,
    fetchNextPage: () => (list.isFetching ? undefined : list.fetchNextPage()),
    refetch: () => Promise.all([list.refetch(), details.refetch()]),
  };
}

/** Home's shortlist: transaction references, the newest held receipts and
 * already-fetched receipts, with normal cache policy.
 */
export function useReceiptLibrary(
  references: readonly (string | null | undefined)[] = [],
) {
  const client = useQueryClient();
  const cache = client.getQueryCache();
  const subscribe = useCallback(
    (notify: () => void) => {
      const batchedNotify = notifyManager.batchCalls(notify);
      return cache.subscribe((event) => {
        if (
          event.query.queryKey[0] === 'receipt' &&
          (event.type === 'updated' || event.type === 'removed')
        )
          batchedNotify();
      });
    },
    [cache],
  );
  const snapshot = useCallback(
    () =>
      cache
        .findAll({ queryKey: queryKeys.receipt.all })
        .filter((query) => query.state.data !== undefined)
        .map(
          (q) =>
            q.queryHash +
            ':' +
            q.state.dataUpdateCount +
            ':' +
            q.state.errorUpdateCount,
        )
        .join('|'),
    [cache],
  );
  useSyncExternalStore(subscribe, snapshot, snapshot);
  const cached = client
    .getQueriesData<Receipt>({ queryKey: queryKeys.receipt.all })
    .flatMap(([key, value]) => (key[1] === 'detail' && value ? [value] : []));
  // Receipts held without a wallet transaction (scanned fiscal receipts without cashback).
  const held = useQuery({
    queryKey: queryKeys.receipt.list,
    queryFn: ({ signal }) => services.receipt.list(undefined, { signal }),
  });
  const details = useReceiptDetails(
    safeIds([
      ...references,
      ...(held.data?.items.map((item) => item.id) ?? []),
      ...cached.map((receipt) => receipt.id),
    ]),
  );
  return {
    ...details,
    receipts: details.receipts.sort(
      (a, b) => Date.parse(b.issuedAt) - Date.parse(a.issuedAt),
    ),
  };
}
