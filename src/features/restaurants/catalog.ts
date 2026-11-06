import { useQuery } from '@tanstack/react-query';
import { env } from '@/lib/env';
import {
  catalogSchema,
  type Catalog,
} from '@/services/contracts/restaurant-catalog';
export type {
  Catalog,
  CatalogDish,
  FoodPhoto,
} from '@/services/contracts/restaurant-catalog';

/** No public-menu API exists in the current backend contract. Mock-only fixtures
 * are dynamically loaded; live mode returns an honest unavailable state. */
export async function readCatalog(id: string): Promise<Catalog | null> {
  if (
    !__DEV__ ||
    env.EXPO_PUBLIC_APP_ENV === 'production' ||
    env.EXPO_PUBLIC_API_MODE !== 'mock'
  )
    return null;
  const { catalogs } = await import('@/services/mock/restaurant-catalog');
  const value = catalogs[id];
  return value ? catalogSchema.parse(value) : null;
}
export function useCatalog(id: string) {
  return useQuery({
    queryKey: ['restaurant', 'catalog', id],
    queryFn: () => readCatalog(id),
    enabled: Boolean(id),
  });
}
