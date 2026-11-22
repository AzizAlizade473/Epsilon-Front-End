import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { demoContent } from '@/lib/demoContent';
import type {
  Catalog,
  CatalogLanguage,
} from '@/services/contracts/restaurant-catalog';

/** One card in "Explore dishes". */
export type ExploreItem = {
  key: string;
  kind: 'dish';
  title: string;
  subtitle: string;
  imageUrl: string | null;
  rating: { average: number; count: number };
};
export type ExploreTarget = {
  pathname: '/restaurant/[id]/dish/[dishId]';
  id: string;
  dishId: string;
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

/**
 * Dishes come from the isolated demo data layer; production builds get nothing
 * (no restaurant demo ever ships), and the section hides.
 */
export function useExplore() {
  const { i18n } = useTranslation();
  const language: CatalogLanguage =
    i18n.language === 'en' || i18n.language === 'ru' ? i18n.language : 'az';
  return useQuery({
    queryKey: ['home', 'explore', language],
    staleTime: Infinity,
    queryFn: async () => {
      if (!demoContent()) return { dishes: [] };
      const [dining, fixtures] = await Promise.all([
        import('@/services/mock/restaurant-catalog'),
        import('@/services/mock/fixtures'),
      ]);
      const restaurants = fixtures.mockRestaurants
        .slice(0, 12)
        .flatMap<NamedCatalog>((r) => {
          const catalog = dining.mockCatalog(r.id, language);
          return catalog ? [{ name: r.name, catalog }] : [];
        });
      return { dishes: pickDishes(restaurants, 6) };
    },
  });
}
