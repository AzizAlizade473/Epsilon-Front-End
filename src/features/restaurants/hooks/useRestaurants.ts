import {
  infiniteQueryOptions,
  useInfiniteQuery,
  useQuery,
} from '@tanstack/react-query';
import { useMemo } from 'react';
import { services } from '@/services';
import { demoContent } from '@/lib/demoContent';
import { env } from '@/lib/env';
import { queryKeys } from '@/services/query';

/**
 * Live development builds list the labelled demo restaurants (their menus exist only
 * there); mock builds already run on them, production only ever on the real API.
 */
export async function restaurantService() {
  if (!demoContent() || env.EXPO_PUBLIC_API_MODE === 'mock')
    return services.restaurant;
  const { mockServices } = await import('@/services/mock/services');
  return mockServices.restaurant;
}

export function useRestaurant(id: string, enabled = Boolean(id)) {
  return useQuery({
    queryKey: queryKeys.restaurant.detail(id),
    queryFn: async () => (await restaurantService()).get(id),
    enabled,
  });
}

export function restaurantOptions(search: string, limit = 20) {
  return infiniteQueryOptions({
    queryKey: queryKeys.restaurant.list({ search, limit }),
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam, signal }) =>
      (await restaurantService()).list(
        { search, limit, ...(pageParam ? { cursor: pageParam } : {}) },
        { signal },
      ),
    getNextPageParam: (last, _pages, current, previous) =>
      last.nextCursor &&
      last.nextCursor !== current &&
      !previous.includes(last.nextCursor)
        ? last.nextCursor
        : undefined,
  });
}
export function useRestaurants(search: string) {
  const query = useInfiniteQuery(restaurantOptions(search));
  const items = useMemo(
    () =>
      [
        ...new Map(
          query.data?.pages
            .flatMap((page) => page.items)
            .map((item) => [item.id, item]),
        ).values(),
      ].filter((item) =>
        item.name
          .toLocaleLowerCase('az')
          .includes(search.toLocaleLowerCase('az')),
      ),
    [query.data, search],
  );
  return { ...query, items };
}
export { useDebouncedSearch as useRestaurantSearch } from '@/hooks/useDebouncedSearch';
