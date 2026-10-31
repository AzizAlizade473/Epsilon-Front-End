import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { services } from '@/services';
import { queryKeys } from '@/services/query';

export function restaurantOptions(search: string, limit = 20) {
  return infiniteQueryOptions({
    queryKey: queryKeys.restaurant.list({ search, limit }),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) =>
      services.restaurant.list(
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
export function useRestaurantSearch(value: string) {
  const [search, setSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setSearch(value.trim()), 300);
    return () => clearTimeout(timer);
  }, [value]);
  // Clearing is immediate; changing a query never retains the previous results.
  return value.trim() === '' ? '' : search;
}
