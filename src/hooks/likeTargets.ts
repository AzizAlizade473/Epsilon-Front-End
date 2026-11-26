import type { Href } from 'expo-router';
import { safeIdSchema } from '@/lib/deep-link';
import type { LikeItem, LikeKind, LikeSnapshot } from '@/services/contracts';

export type LikeTarget = {
  kind: LikeKind;
  targetId: string;
  snapshot: LikeSnapshot;
};

function target(
  kind: LikeKind,
  targetId: string,
  restaurantId: string,
  dishId: string | null,
  title: string,
  subtitle: string,
  imageUrl: string | null | undefined,
): LikeTarget {
  return {
    kind,
    targetId,
    snapshot: {
      restaurantId,
      dishId,
      title: title.slice(0, 200),
      subtitle: subtitle.slice(0, 200),
      imageUrl:
        imageUrl?.startsWith('https://') && imageUrl.length <= 500
          ? imageUrl
          : null,
    },
  };
}
export const dishLike = (
  restaurantId: string,
  dishId: string,
  name: string,
  restaurant: string,
  imageUrl?: string | null,
) =>
  target(
    'dish',
    `${restaurantId}:${dishId}`,
    restaurantId,
    dishId,
    name,
    restaurant,
    imageUrl,
  );
export const restaurantLike = (
  restaurantId: string,
  name: string,
  subtitle: string,
  imageUrl?: string | null,
) =>
  target(
    'restaurant',
    restaurantId,
    restaurantId,
    null,
    name,
    subtitle,
    imageUrl,
  );
export const reviewLike = (
  restaurantId: string,
  dishId: string,
  reviewId: string,
  dishName: string,
  comment: string,
  imageUrl?: string | null,
) =>
  target('review', reviewId, restaurantId, dishId, dishName, comment, imageUrl);

/** Where a liked item opens; null when its stored reference cannot be opened. */
export function likeDestination(item: LikeItem): Href | null {
  const id = item.restaurantId;
  if (!safeIdSchema.safeParse(id).success) return null;
  if (item.kind === 'restaurant')
    return { pathname: '/restaurant/[id]', params: { id } };
  const dishId = item.dishId;
  if (!dishId || !safeIdSchema.safeParse(dishId).success) return null;
  return item.kind === 'dish'
    ? { pathname: '/restaurant/[id]/dish/[dishId]', params: { id, dishId } }
    : {
        pathname: '/restaurant/[id]/dish/[dishId]/reviews',
        params: { id, dishId, review: item.targetId },
      };
}
