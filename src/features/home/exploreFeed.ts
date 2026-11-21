import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { env } from '@/lib/env';
import type {
  Catalog,
  CatalogLanguage,
} from '@/services/contracts/restaurant-catalog';
import type { RetailCatalog } from '@/services/contracts/retail';

/** One card in "Explore products & dishes", from either sector. */
export type ExploreItem = {
  key: string;
  kind: 'dish' | 'product';
  title: string;
  subtitle: string;
  imageUrl: string | null;
  rating: { average: number; count: number };
};
export type ExploreTarget =
  | { pathname: '/restaurant/[id]/dish/[dishId]'; id: string; dishId: string }
  | {
      pathname: '/supermarket/[id]/product/[productId]';
      id: string;
      productId: string;
    };
export type ExploreEntry = ExploreItem & { target: ExploreTarget };

type NamedCatalog = { name: string; catalog: Catalog };

/** Best-rated food dish per restaurant (drinks skipped), in directory order. */
export function pickDishes(restaurants: NamedCatalog[], limit: number) {
  return restaurants
    .flatMap<ExploreEntry>(({ name, catalog }) => {
      const dish = catalog.dishes
        .filter((d) => d.categoryId !== 'drink' && d.rating.count > 0)
        .sort(
          (a, b) =>
            b.rating.average - a.rating.average ||
            b.rating.count - a.rating.count ||
            a.id.localeCompare(b.id),
        )[0];
      return dish
        ? [
            {
              key: `dish_${catalog.restaurantId}_${dish.id}`,
              kind: 'dish',
              title: dish.name,
              subtitle: name,
              imageUrl: dish.imageUrl,
              rating: {
                average: dish.rating.average,
                count: dish.rating.count,
              },
              target: {
                pathname: '/restaurant/[id]/dish/[dishId]',
                id: catalog.restaurantId,
                dishId: dish.id,
              },
            },
          ]
        : [];
    })
    .slice(0, limit);
}

/** Own-brand products first, then best-rated; real packshots only. */
export function pickProducts(catalog: RetailCatalog, limit: number) {
  const chains = new Map(catalog.supermarkets.map((s) => [s.id, s.name]));
  return catalog.products
    .filter((p) => p.imageUrl)
    .flatMap<ExploreEntry & { own: boolean }>((p) => {
      const reviews = catalog.reviews.filter((r) => r.productId === p.id);
      const listing = catalog.listings.find((l) => l.productId === p.id);
      if (!reviews.length || !listing) return [];
      const average =
        Math.round(
          (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10,
        ) / 10;
      return [
        {
          key: `product_${p.id}`,
          kind: 'product',
          title: p.name,
          subtitle: `${p.brand === '—' ? '' : `${p.brand} · `}${p.size} · ${chains.get(listing.supermarketId) ?? ''}`,
          imageUrl: p.imageUrl,
          rating: { average, count: reviews.length },
          own: p.privateLabel,
          target: {
            pathname: '/supermarket/[id]/product/[productId]',
            id: listing.supermarketId,
            productId: p.id,
          },
        },
      ];
    })
    .sort(
      (a, b) =>
        Number(b.own) - Number(a.own) ||
        b.rating.average - a.rating.average ||
        a.key.localeCompare(b.key),
    )
    .slice(0, limit);
}

/** Alternate sectors (dish, product, dish, …) so neither dominates; deterministic. */
export function interleave<T>(first: T[], second: T[]): T[] {
  const out: T[] = [];
  for (let i = 0; i < Math.max(first.length, second.length); i++) {
    if (first[i]) out.push(first[i]!);
    if (second[i]) out.push(second[i]!);
  }
  return out;
}

export type ExploreFilter = 'all' | 'restaurants' | 'supermarkets';
export function filterFeed(
  dishes: ExploreEntry[],
  products: ExploreEntry[],
  filter: ExploreFilter,
) {
  return filter === 'restaurants'
    ? dishes
    : filter === 'supermarkets'
      ? products
      : interleave(dishes, products);
}

/**
 * Both sectors come from the isolated demo data layer; production builds get
 * nothing (no restaurant or retail demo ever ships), and the section hides.
 */
export function useExplore() {
  const { i18n } = useTranslation();
  const language: CatalogLanguage =
    i18n.language === 'en' || i18n.language === 'ru' ? i18n.language : 'az';
  return useQuery({
    queryKey: ['home', 'explore', language],
    staleTime: Infinity,
    queryFn: async () => {
      if (env.EXPO_PUBLIC_APP_ENV === 'production')
        return { dishes: [], products: [] };
      const [dining, retail, fixtures] = await Promise.all([
        import('@/services/mock/restaurant-catalog'),
        import('@/services/mock/retail'),
        import('@/services/mock/fixtures'),
      ]);
      const restaurants = fixtures.mockRestaurants
        .slice(0, 12)
        .flatMap<NamedCatalog>((r) => {
          const catalog = dining.mockCatalog(r.id, language);
          return catalog ? [{ name: r.name, catalog }] : [];
        });
      return {
        dishes: pickDishes(restaurants, 6),
        products: pickProducts(retail.mockRetailCatalog(language), 6),
      };
    },
  });
}
