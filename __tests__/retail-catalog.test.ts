import { expect, it, jest } from '@jest/globals';
import { mockRetailCatalog } from '@/services/mock/retail';
import { retailCatalogSchema } from '@/services/contracts/retail';
import {
  attributeAverages,
  filterShelf,
  readRetailCatalog,
  shelfFor,
  summarize,
} from '@/features/supermarkets/retail';
import {
  clearDemoRatings,
  saveDemoRating,
} from '@/features/supermarkets/demoRatings';

let mockAppEnv = 'development';
jest.mock('@/lib/env', () => ({
  env: {
    get EXPO_PUBLIC_APP_ENV() {
      return mockAppEnv;
    },
    EXPO_PUBLIC_API_MODE: 'live',
  },
}));

const catalog = mockRetailCatalog('en');

it('lists the five real chains as demo, never as partners or verified buyers', () => {
  for (const lang of ['az', 'en', 'ru'] as const)
    retailCatalogSchema.parse(mockRetailCatalog(lang));
  expect(catalog.supermarkets.map((s) => s.id)).toEqual([
    'araz',
    'bravo',
    'tamstore',
    'rahat',
    'spar',
  ]);
  expect(catalog.supermarkets.every((s) => s.demo)).toBe(true);
  expect(catalog.reviews.every((r) => r.verification === 'sample')).toBe(true);
  expect(catalog.reviews.every((r) => r.receiptItemId === null)).toBe(true);
  expect(catalog.reviews.every((r) => r.author.startsWith('Demo'))).toBe(true);
});

it('backs every product with a source and keeps one identity across chains', () => {
  expect(catalog.products.length).toBeGreaterThanOrEqual(25);
  // Multinational brands are deliberately excluded; own brands are flagged.
  expect(catalog.products.some((p) => p.brand === 'Coca-Cola')).toBe(false);
  expect(catalog.products.some((p) => p.privateLabel)).toBe(true);
  expect(catalog.products.every((p) => p.sources.length > 0)).toBe(true);
  // Nothing could be verified for Rahat, so nothing is listed there.
  expect(catalog.listings.some((l) => l.supermarketId === 'rahat')).toBe(false);
  const danone = catalog.listings.filter(
    (l) => l.productId === 'atena_milk_15_1l',
  );
  expect(danone.map((l) => l.supermarketId).sort()).toEqual([
    'araz',
    'tamstore',
  ]);
  expect(
    catalog.products.filter((p) => p.id === 'atena_milk_15_1l'),
  ).toHaveLength(1);
  for (const r of catalog.reviews)
    expect(
      catalog.listings.some(
        (l) =>
          l.supermarketId === r.supermarketId && l.productId === r.productId,
      ),
    ).toBe(true);
  for (const p of catalog.products) {
    if (p.category === 'household') expect(p.attributes).not.toContain('taste');
    else expect(p.attributes).not.toContain('effectiveness');
  }
});

it('derives average, count and distribution from the same reviews', () => {
  const reviews = catalog.reviews.filter(
    (r) => r.productId === 'atena_milk_15_1l',
  );
  const s = summarize(reviews);
  expect(s.count).toBe(reviews.length);
  expect(s.distribution.reduce((a, b) => a + b, 0)).toBe(s.count);
  const mean = reviews.reduce((a, r) => a + r.rating, 0) / reviews.length;
  expect(s.average).toBe(Math.round(mean * 10) / 10);
  expect(summarize([])).toEqual({
    average: 0,
    count: 0,
    distribution: [0, 0, 0, 0, 0],
  });
  expect(attributeAverages(reviews, ['taste'])[0]!.average).toBeGreaterThan(0);
});

it('searches case-insensitively and filters by category', () => {
  const shelf = shelfFor(catalog, 'tamstore');
  const options = {
    query: 'MILLA',
    category: 'dairy' as const,
    minRating: null,
    sort: 'name' as const,
    categoryLabel: (c: string) => c,
    locale: 'en',
  };
  const hits = filterShelf(shelf, options);
  expect(hits.length).toBeGreaterThan(0);
  expect(hits.every((h) => h.product.brand === 'Milla')).toBe(true);
  expect(
    filterShelf(shelf, { ...options, query: '', category: null }),
  ).toHaveLength(shelf.length);
});

it('keeps demo ratings local and validated', () => {
  expect(() =>
    saveDemoRating({
      productId: 'x',
      rating: 6,
      comment: '',
      createdAt: '2026-11-16T00:00:00Z',
    }),
  ).toThrow();
  clearDemoRatings();
});

it('never serves the branded retail demo in production builds', async () => {
  mockAppEnv = 'production';
  expect(await readRetailCatalog('en')).toBeNull();
  mockAppEnv = 'development';
});
