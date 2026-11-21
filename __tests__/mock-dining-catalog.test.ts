import { describe, expect, it } from '@jest/globals';
import {
  catalogSchema,
  directorySchema,
  reviewListSchema,
  type CatalogLanguage,
} from '@/services/contracts/restaurant-catalog';
import { mockRestaurants } from '@/services/mock/fixtures';
import {
  mockCatalog,
  mockDirectory,
  mockDishReviews,
} from '@/services/mock/restaurant-catalog';

const LANGS: CatalogLanguage[] = ['az', 'en', 'ru'];
const mean = (d: number[]) =>
  Math.round(
    (d.reduce((s, c, i) => s + c * (5 - i), 0) / d.reduce((s, c) => s + c, 0)) *
      10,
  ) / 10;

describe('mock dining catalog', () => {
  it('has 20-30 restaurants and a valid directory in every language', () => {
    expect(mockRestaurants.length).toBeGreaterThanOrEqual(20);
    expect(mockRestaurants.length).toBeLessThanOrEqual(30);
    for (const lang of LANGS) {
      const dir = directorySchema.parse(mockDirectory(lang));
      expect(dir.map((e) => e.restaurantId)).toEqual(
        mockRestaurants.map((r) => r.id),
      );
    }
  });

  it('builds valid, consistent catalogs, reviews and pairings', () => {
    for (const lang of LANGS) {
      for (const { id } of mockRestaurants) {
        const catalog = catalogSchema.parse(mockCatalog(id, lang));
        expect(catalog.dishes.length).toBeGreaterThanOrEqual(8);
        expect(catalog.dishes.length).toBeLessThanOrEqual(14);
        expect(catalog.categories.length).toBeGreaterThanOrEqual(3);
        expect(catalog.categories.length).toBeLessThanOrEqual(5);
        const ids = new Set(catalog.dishes.map((d) => d.id));
        expect(ids.size).toBe(catalog.dishes.length);
        for (const dish of catalog.dishes) {
          const { distribution, count, average } = dish.rating;
          expect(distribution.reduce((s, c) => s + c, 0)).toBe(count);
          expect(average).toBe(mean(distribution));
          expect(dish.description.length).toBeGreaterThan(100);
          for (const p of dish.pairingIds) {
            expect(p).not.toBe(dish.id);
            expect(ids.has(p)).toBe(true);
          }
          const reviews = reviewListSchema.parse(
            mockDishReviews(id, dish.id, lang),
          );
          expect(reviews).toHaveLength(Math.min(dish.rating.reviewCount, 40));
          const times = reviews.map((r) => Date.parse(r.createdAt));
          expect([...times].sort((a, b) => b - a)).toEqual(times);
        }
        const total = catalog.dishes.reduce((s, d) => s + d.rating.count, 0);
        expect(catalog.rating.count).toBe(total);
      }
    }
  });

  it('is deterministic and returns null for unknown ids', () => {
    expect(mockDirectory('en')).toEqual(mockDirectory('en'));
    expect(mockCatalog('rest_05', 'az')).toEqual(mockCatalog('rest_05', 'az'));
    expect(mockCatalog('nope', 'en')).toBeNull();
    expect(mockDishReviews('rest_01', 'nope', 'en')).toBeNull();
    expect(mockDishReviews('nope', 'plov', 'en')).toBeNull();
  });
});
