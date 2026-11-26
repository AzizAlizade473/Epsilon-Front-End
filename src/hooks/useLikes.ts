import { useRouter } from 'expo-router';
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { authOperation } from '@/lib/auth-lifecycle';
import type { LikeTarget } from '@/hooks/likeTargets';
import { useSignedIn } from '@/providers/signed-in';
import { useToast } from '@/providers/ToastProvider';
import { services } from '@/services';
import type {
  LikeItem,
  LikeKind,
  LikeResult,
  Paginated,
} from '@/services/contracts';
import { queryKeys } from '@/services/query';

type Batch = {
  ids: Set<string>;
  result: Promise<Map<string, LikeResult>>;
};
const open = new Map<LikeKind, Batch>();
/** Hearts mounted in the same tick share one request of up to 100 targets. */
export function loadLikeState(
  kind: LikeKind,
  targetId: string,
): Promise<LikeResult> {
  let batch = open.get(kind);
  if (!batch || batch.ids.size >= 100) {
    const ids = new Set<string>();
    const result = Promise.resolve().then(async () => {
      if (open.get(kind)?.ids === ids) open.delete(kind);
      const response = await services.like.state(kind, [...ids]);
      return new Map(
        response.items.map(({ targetId: id, liked, count }) => [
          id,
          { liked, count },
        ]),
      );
    });
    batch = { ids, result };
    open.set(kind, batch);
  }
  batch.ids.add(targetId);
  return batch.result.then(
    (states) => states.get(targetId) ?? { liked: false, count: 0 },
  );
}

type Lists = InfiniteData<Paginated<LikeItem>, string | undefined>;
const locks = new WeakMap<QueryClient, Set<string>>();
function locksOf(client: QueryClient) {
  let held = locks.get(client);
  if (!held) locks.set(client, (held = new Set()));
  return held;
}

/** Takes the item out of every cached list; the returned call puts it back. */
function removeFromLists(client: QueryClient, kind: string, targetId: string) {
  const restore: (() => void)[] = [];
  for (const [key, data] of client.getQueriesData<Lists>({
    queryKey: queryKeys.likes.lists,
  })) {
    data?.pages.forEach((page, pageIndex) => {
      const index = page.items.findIndex(
        (item) => item.kind === kind && item.targetId === targetId,
      );
      if (index < 0) return;
      const item = page.items[index]!;
      const edit = (change: (items: LikeItem[]) => void) =>
        client.setQueryData<Lists>(key, (current) =>
          current
            ? {
                ...current,
                pages: current.pages.map((p, i) => {
                  if (i !== pageIndex) return p;
                  const items = [...p.items];
                  change(items);
                  return { ...p, items };
                }),
              }
            : current,
        );
      edit((items) => items.splice(index, 1));
      restore.push(() => edit((items) => items.splice(index, 0, item)));
    });
  }
  return () => restore.forEach((undo) => undo());
}

/**
 * Optimistic like/unlike shared by every screen. A second call for the same
 * target while one is in flight does nothing; a failure rolls back and throws.
 */
export async function setLike(
  client: QueryClient,
  { kind, targetId, snapshot }: LikeTarget,
  liked: boolean,
) {
  const held = locksOf(client);
  const lock = `${kind}/${targetId}`;
  if (held.has(lock)) return;
  held.add(lock);
  const epoch = authOperation.epoch();
  const key = queryKeys.likes.state(kind, targetId);
  let undoLists = () => {};
  let previous: LikeResult | undefined;
  try {
    await Promise.all([
      client.cancelQueries({ queryKey: key }),
      client.cancelQueries({ queryKey: queryKeys.likes.lists }),
    ]);
    previous = client.getQueryData<LikeResult>(key);
    const change = liked === Boolean(previous?.liked) ? 0 : liked ? 1 : -1;
    client.setQueryData<LikeResult>(key, {
      liked,
      count: Math.max(0, (previous?.count ?? 0) + change),
    });
    if (!liked) undoLists = removeFromLists(client, kind, targetId);
    const result = liked
      ? await services.like.like(kind, targetId, snapshot)
      : await services.like.unlike(kind, targetId);
    // Never write one account's answer into the next account's cache.
    if (!authOperation.current(epoch)) return;
    client.setQueryData(key, result);
    void client.invalidateQueries({ queryKey: queryKeys.likes.lists });
  } catch (error) {
    if (!authOperation.current(epoch)) return;
    if (previous) client.setQueryData(key, previous);
    else void client.resetQueries({ queryKey: key, exact: true });
    undoLists();
    throw error;
  } finally {
    held.delete(lock);
  }
}

export function useLike(target: LikeTarget) {
  const signedIn = useSignedIn();
  const client = useQueryClient();
  const router = useRouter();
  const toast = useToast();
  const { t } = useTranslation();
  const key = queryKeys.likes.state(target.kind, target.targetId);
  const query = useQuery({
    queryKey: key,
    enabled: signedIn,
    queryFn: () => loadLikeState(target.kind, target.targetId),
  });
  return {
    liked: query.data?.liked ?? false,
    count: query.data?.count ?? 0,
    toggle() {
      if (!signedIn) {
        router.push('/login');
        return;
      }
      const liked = client.getQueryData<LikeResult>(key)?.liked ?? false;
      void setLike(client, target, !liked).catch(() => toast(t('likes.error')));
    },
  };
}

export function useLikedList(kind: LikeKind) {
  const client = useQueryClient();
  return useInfiniteQuery({
    queryKey: queryKeys.likes.list(kind),
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam, signal }) => {
      const page = await services.like.list(
        { kind, limit: 20, ...(pageParam ? { cursor: pageParam } : {}) },
        { signal },
      );
      // The list already knows each state: no second request per heart.
      for (const item of page.items)
        if (!locksOf(client).has(`${item.kind}/${item.targetId}`))
          client.setQueryData(queryKeys.likes.state(item.kind, item.targetId), {
            liked: true,
            count: item.count,
          });
      return page;
    },
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
            .map((item) => [item.targetId, item]),
        ).values(),
      ],
    }),
  });
}
