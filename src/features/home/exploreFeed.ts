import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { demoContent } from '@/lib/demoContent';
import type {
  Aspect,
  Catalog,
  CatalogDish,
  CatalogLanguage,
  Review,
} from '@/services/contracts/restaurant-catalog';

/** One card in "Explore dishes". */
export type ExploreItem = {
  key: string;
  kind: 'dish';
  title: string;
  subtitle: string;
  imageUrl: string | null;
  rating: { average: number; count: number };
  /** Written reviews mentioning each aspect (full collection only). */
  mentions: Partial<Record<Aspect, number>>;
};
export type ExploreTarget = {
  pathname: '/restaurant/[id]/dish/[dishId]';
  id: string;
  dishId: string;
};
export type ExploreEntry = ExploreItem & { target: ExploreTarget };

type NamedCatalog = {
  name: string;
  catalog: Catalog;
  reviews?: (dishId: string) => readonly Review[];
};

function toEntry(
  { name, catalog, reviews }: NamedCatalog,
  dish: CatalogDish,
): ExploreEntry {
  const mentions: ExploreItem['mentions'] = {};
  for (const review of reviews?.(dish.id) ?? [])
    for (const aspect of review.aspects)
      mentions[aspect] = (mentions[aspect] ?? 0) + 1;
  return {
    key: `dish_${catalog.restaurantId}_${dish.id}`,
    kind: 'dish',
    title: dish.name,
    subtitle: name,
    imageUrl: dish.imageUrl,
    rating: { average: dish.rating.average, count: dish.rating.count },
    mentions,
    target: {
      pathname: '/restaurant/[id]/dish/[dishId]',
      id: catalog.restaurantId,
      dishId: dish.id,
    },
  };
}

/** Best-rated food dish per restaurant (drinks skipped), in directory order. */
export function pickDishes(restaurants: NamedCatalog[], limit: number) {
  return restaurants
    .flatMap((restaurant) => {
      const dish = restaurant.catalog.dishes
        .filter((d) => d.categoryId !== 'drink' && d.rating.count > 0)
        .sort(
          (a, b) =>
            b.rating.average - a.rating.average ||
            b.rating.count - a.rating.count ||
            a.id.localeCompare(b.id),
        )[0];
      return dish ? [toEntry(restaurant, dish)] : [];
    })
    .slice(0, limit);
}

export function allDishes(restaurants: NamedCatalog[]) {
  return restaurants.flatMap((restaurant) =>
    restaurant.catalog.dishes.map((dish) => toEntry(restaurant, dish)),
  );
}

export type DishSort = 'top' | 'rated' | 'mentioned';
export const mentionCount = (entry: ExploreItem, aspect: Aspect | null) =>
  aspect
    ? (entry.mentions[aspect] ?? 0)
    : Object.values(entry.mentions).reduce((sum, count) => sum + count, 0);

/** An aspect keeps only dishes it is mentioned for; every sort respects it. */
export function sortDishes(
  entries: readonly ExploreEntry[],
  sort: DishSort,
  aspect: Aspect | null,
) {
  const score = (entry: ExploreEntry) =>
    sort === 'top'
      ? entry.rating.average
      : sort === 'rated'
        ? entry.rating.count
        : mentionCount(entry, aspect);
  return entries
    .filter((entry) => !aspect || mentionCount(entry, aspect) > 0)
    .sort(
      (a, b) =>
        score(b) - score(a) ||
        b.rating.count - a.rating.count ||
        a.key.localeCompare(b.key),
    );
}

async function readRestaurants(language: CatalogLanguage, limit?: number) {
  const [dining, fixtures] = await Promise.all([
    import('@/services/mock/restaurant-catalog'),
    import('@/services/mock/fixtures'),
  ]);
  return fixtures.mockRestaurants.slice(0, limit).flatMap<NamedCatalog>((r) => {
    const catalog = dining.mockCatalog(r.id, language);
    return catalog
      ? [
          {
            name: r.name,
            catalog,
            reviews: (dishId) =>
              dining.mockDishReviews(r.id, dishId, language) ?? [],
          },
        ]
      : [];
  });
}
function useLanguage(): CatalogLanguage {
  const { i18n } = useTranslation();
  return i18n.language === 'en' || i18n.language === 'ru'
    ? i18n.language
    : 'az';
}

/**
 * Dishes come from the isolated demo data layer; production builds get nothing
 * (no restaurant demo ever ships), and the section hides.
 */
export function useExplore() {
  const language = useLanguage();
  return useQuery({
    queryKey: ['home', 'explore', language],
    staleTime: Infinity,
    queryFn: async () => ({
      dishes: demoContent()
        ? pickDishes(await readRestaurants(language, 12), 6)
        : [],
    }),
  });
}
export function useAllDishes() {
  const language = useLanguage();
  return useQuery({
    queryKey: ['home', 'dishes', language],
    staleTime: Infinity,
    queryFn: async () =>
      demoContent() ? allDishes(await readRestaurants(language)) : [],
  });
}
