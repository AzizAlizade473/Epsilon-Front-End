import { useCallback, useSyncExternalStore } from 'react';
import {
  notifyManager,
  useQueries,
  useQueryClient,
} from '@tanstack/react-query';
import { safeIdSchema } from '@/lib/deep-link';
import { services, type Receipt } from '@/services';
import { queryKeys } from '@/services/query';

/** Current contract has get(id), not a receipt-list operation. Only use real
 * transaction references and already-fetched receipts, with normal cache policy.
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
  const ids = [
    ...new Set([...references, ...cached.map((receipt) => receipt.id)]),
  ].filter(
    (id): id is string =>
      typeof id === 'string' && safeIdSchema.safeParse(id).success,
  );
  const queries = useQueries({
    queries: ids.map((id) => ({
      queryKey: queryKeys.receipt.detail(id),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        services.receipt.get(id, { signal }),
    })),
  });
  const receipts = [
    ...new Map(
      queries
        .flatMap((query) => (query.data ? [query.data] : []))
        .map((receipt) => [receipt.id, receipt]),
    ).values(),
  ].sort((a, b) => Date.parse(b.issuedAt) - Date.parse(a.issuedAt));
  return {
    receipts,
    isPending: queries.some((query) => query.isPending),
    isError: queries.some((query) => query.isError),
    isFetching: queries.some((query) => query.isFetching),
    refetch: () => Promise.all(queries.map((query) => query.refetch())),
  };
}
