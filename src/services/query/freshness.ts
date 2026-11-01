import type { QueryClient, QueryKey } from '@tanstack/react-query';
import { monotonicNow } from '@/lib/server-clock';
const resolved = new WeakMap<object, number>();
/** Monotonic freshness avoids device-clock jumps and duplicate focus requests. */
export function trackQueryFreshness(client: QueryClient) {
  return client.getQueryCache().subscribe((event) => {
    if (
      event.type === 'updated' &&
      event.action.type === 'success' &&
      event.query.state.dataUpdatedAt > 0
    )
      resolved.set(event.query, monotonicNow());
  });
}
export function refetchStaleActive(client: QueryClient, queryKey?: QueryKey) {
  return client.refetchQueries(
    {
      queryKey,
      type: 'active',
      predicate: (query) => {
        if (query.state.fetchStatus === 'fetching') return false;
        if (query.state.isInvalidated || query.state.data === undefined)
          return true;
        const at = resolved.get(query);
        const configured = (query.options as { staleTime?: unknown }).staleTime;
        const lifetime = typeof configured === 'number' ? configured : 30_000;
        return at === undefined || monotonicNow() - at >= lifetime;
      },
    },
    { cancelRefetch: false },
  );
}
