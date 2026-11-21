import { expect, it, jest } from '@jest/globals';
import {
  filterFeed,
  interleave,
  pickDishes,
  pickProducts,
} from '@/features/home/exploreFeed';
import { mockCatalog } from '@/services/mock/restaurant-catalog';
import { mockRetailCatalog } from '@/services/mock/retail';
import { mockRestaurants } from '@/services/mock/fixtures';

jest.mock('@/lib/env', () => ({
  env: { EXPO_PUBLIC_APP_ENV: 'development', EXPO_PUBLIC_API_MODE: 'mock' },
}));

const restaurants = mockRestaurants.slice(0, 12).map((r) => ({
  name: r.name,
  catalog: mockCatalog(r.id, 'en')!,
}));
const dishes = pickDishes(restaurants, 6);
const products = pickProducts(mockRetailCatalog('en'), 6);

it('builds a mixed, deterministic feed from both sectors', () => {
  expect(dishes).toHaveLength(6);
  expect(products).toHaveLength(6);
  const all = filterFeed(dishes, products, 'all');
  expect(all.map((e) => e.kind)).toEqual(
    Array.from({ length: 12 }, (_, i) => (i % 2 === 0 ? 'dish' : 'product')),
  );
  expect(filterFeed(dishes, products, 'all')).toEqual(all);
  expect(filterFeed(dishes, products, 'restaurants')).toBe(dishes);
  expect(filterFeed(dishes, products, 'supermarkets')).toBe(products);
  expect(interleave([1, 2, 3], [9])).toEqual([1, 9, 2, 3]);
});

it('maps every card to its own image and correct destination', () => {
  for (const d of dishes) {
    expect(d.imageUrl).toMatch(/^https:/);
    expect(d.target.pathname).toBe('/restaurant/[id]/dish/[dishId]');
  }
  const retail = mockRetailCatalog('en');
  for (const p of products) {
    expect(p.target.pathname).toBe('/supermarket/[id]/product/[productId]');
    if (p.target.pathname !== '/supermarket/[id]/product/[productId]') continue;
    const target = p.target;
    const product = retail.products.find((x) => x.id === target.productId)!;
    expect(p.title).toBe(product.name);
    expect(p.imageUrl).toBe(product.imageUrl);
    // The linked chain must really list this product.
    expect(
      retail.listings.some(
        (l) =>
          l.supermarketId === target.id && l.productId === target.productId,
      ),
    ).toBe(true);
  }
});

it('shows own-brand products first and puts no price on feed cards', () => {
  const retail = mockRetailCatalog('en');
  const lead = products[0]!.target;
  if (lead.pathname !== '/supermarket/[id]/product/[productId]')
    throw new Error('expected a product');
  expect(
    retail.products.find((p) => p.id === lead.productId)!.privateLabel,
  ).toBe(true);
  for (const e of [...dishes, ...products])
    expect(Object.keys(e)).not.toContain('priceMinor');
});
