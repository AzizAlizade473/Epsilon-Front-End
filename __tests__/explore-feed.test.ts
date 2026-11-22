import { expect, it, jest } from '@jest/globals';
import { pickDishes } from '@/features/home/exploreFeed';
import { mockCatalog } from '@/services/mock/restaurant-catalog';
import { mockRestaurants } from '@/services/mock/fixtures';

jest.mock('@/lib/env', () => ({
  env: { EXPO_PUBLIC_APP_ENV: 'development', EXPO_PUBLIC_API_MODE: 'mock' },
}));

const restaurants = mockRestaurants.slice(0, 12).map((r) => ({
  name: r.name,
  catalog: mockCatalog(r.id, 'en')!,
}));
const dishes = pickDishes(restaurants, 6);

it('picks one best-rated food dish per restaurant, deterministically', () => {
  expect(dishes).toHaveLength(6);
  expect(pickDishes(restaurants, 6)).toEqual(dishes);
  expect(new Set(dishes.map((d) => d.target.id)).size).toBe(6);
});

it('maps every card to its own image and its dish page', () => {
  for (const d of dishes) {
    expect(d.kind).toBe('dish');
    expect(d.imageUrl).toMatch(/^https:/);
    expect(d.target.pathname).toBe('/restaurant/[id]/dish/[dishId]');
  }
});
