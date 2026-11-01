import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { services } from '@/services';
import { queryKeys } from '@/services/query';
export function useProfile() {
  return useQuery({
    queryKey: queryKeys.user.profile(),
    queryFn: ({ signal }) => services.user.me({ signal }),
  });
}
export const reviewsKey = [...queryKeys.feedback.all, 'reviews'] as const;
export function useReviews() {
  return useInfiniteQuery({
    queryKey: reviewsKey,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) =>
      services.feedback.list({ cursor: pageParam, limit: 20 }, { signal }),
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
            .map((item) => [item.feedbackId, item]),
        ).values(),
      ],
    }),
  });
}
