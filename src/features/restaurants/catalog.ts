import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { env } from '@/lib/env';
import {
  catalogSchema,
  directorySchema,
  reviewListSchema,
  type Aspect,
  type Catalog,
  type CatalogLanguage,
  type DirectoryEntry,
  type Review,
} from '@/services/contracts/restaurant-catalog';
export type {
  Allergen,
  Aspect,
  Catalog,
  CatalogDish,
  Cuisine,
  DirectoryEntry,
  FoodPhoto,
  Ingredient,
  RatingSummary,
  Review,
} from '@/services/contracts/restaurant-catalog';

/** No public-menu API exists in the current backend contract. Mock-only fixtures
 * are dynamically loaded; live mode returns an honest unavailable state. */
function mockOnly() {
  return (
    env.EXPO_PUBLIC_APP_ENV !== 'production' &&
    env.EXPO_PUBLIC_API_MODE === 'mock'
  );
}
export function catalogLanguage(language: string): CatalogLanguage {
  return language === 'en' || language === 'ru' ? language : 'az';
}
export async function readCatalog(
  id: string,
  language: CatalogLanguage = 'az',
): Promise<Catalog | null> {
  if (!mockOnly()) return null;
  const { mockCatalog } = await import('@/services/mock/restaurant-catalog');
  const value = mockCatalog(id, language);
  return value ? catalogSchema.parse(value) : null;
}
export async function readDirectory(
  language: CatalogLanguage = 'az',
): Promise<DirectoryEntry[]> {
  if (!mockOnly()) return [];
  const { mockDirectory } = await import('@/services/mock/restaurant-catalog');
  return directorySchema.parse(mockDirectory(language));
}
export async function readDishReviews(
  id: string,
  dishId: string,
  language: CatalogLanguage = 'az',
): Promise<Review[] | null> {
  if (!mockOnly()) return null;
  const { mockDishReviews } =
    await import('@/services/mock/restaurant-catalog');
  const value = mockDishReviews(id, dishId, language);
  return value ? reviewListSchema.parse(value) : null;
}

function useLanguage() {
  return catalogLanguage(useTranslation().i18n.language);
}
export function useCatalog(id: string) {
  const language = useLanguage();
  return useQuery({
    queryKey: ['restaurant', 'catalog', id, language],
    queryFn: () => readCatalog(id, language),
    enabled: Boolean(id),
  });
}
export function useDirectory() {
  const language = useLanguage();
  return useQuery({
    queryKey: ['restaurant', 'directory', language],
    queryFn: () => readDirectory(language),
  });
}
export function useDishReviews(id: string, dishId: string) {
  const language = useLanguage();
  return useQuery({
    queryKey: ['restaurant', 'reviews', id, dishId, language],
    queryFn: () => readDishReviews(id, dishId, language),
    enabled: Boolean(id && dishId),
  });
}

export type ReviewSort = 'newest' | 'highest' | 'lowest';
export type ReviewFilter = {
  stars: number | null;
  aspect: Aspect | null;
  sort: ReviewSort;
};
/** Pure, so filtering/sorting is unit-tested without rendering. */
export function filterReviews(reviews: readonly Review[], f: ReviewFilter) {
  const kept = reviews.filter(
    (r) =>
      (f.stars === null || r.rating === f.stars) &&
      (f.aspect === null || r.aspects.includes(f.aspect)),
  );
  const time = (r: Review) => Date.parse(r.createdAt);
  return kept.sort((a, b) =>
    f.sort === 'newest'
      ? time(b) - time(a)
      : (f.sort === 'highest' ? b.rating - a.rating : a.rating - b.rating) ||
        time(b) - time(a),
  );
}
/** Mentions per aspect, most mentioned first. */
export function aspectCounts(reviews: readonly Review[]) {
  const counts = new Map<Aspect, number>();
  for (const r of reviews)
    for (const a of r.aspects) counts.set(a, (counts.get(a) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1]);
}
