import { expect, it, jest } from '@jest/globals';
import {
  aspectCounts,
  catalogLanguage,
  filterReviews,
  type Review,
} from '@/features/restaurants/catalog';

jest.mock('@/lib/env', () => ({
  env: { EXPO_PUBLIC_APP_ENV: 'development', EXPO_PUBLIC_API_MODE: 'mock' },
}));

const review = (
  id: string,
  rating: number,
  day: number,
  aspects: Review['aspects'] = [],
): Review => ({
  id,
  rating,
  createdAt: `2026-10-${String(day).padStart(2, '0')}T12:00:00.000Z`,
  author: 'A*** M.',
  comment: 'ok',
  aspects,
});
const reviews = [
  review('a', 5, 1, ['taste']),
  review('b', 2, 9, ['portion', 'taste']),
  review('c', 5, 20, ['value']),
  review('d', 4, 5),
];

it('sorts newest first by default and breaks rating ties by recency', () => {
  const all = { stars: null, aspect: null } as const;
  expect(
    filterReviews(reviews, { ...all, sort: 'newest' }).map((r) => r.id),
  ).toEqual(['c', 'b', 'd', 'a']);
  expect(
    filterReviews(reviews, { ...all, sort: 'highest' }).map((r) => r.id),
  ).toEqual(['c', 'a', 'd', 'b']);
  expect(
    filterReviews(reviews, { ...all, sort: 'lowest' }).map((r) => r.id),
  ).toEqual(['b', 'd', 'c', 'a']);
});
it('filters by star and aspect without mutating the input', () => {
  const copy = [...reviews];
  expect(
    filterReviews(reviews, { stars: 5, aspect: null, sort: 'newest' }).map(
      (r) => r.id,
    ),
  ).toEqual(['c', 'a']);
  expect(
    filterReviews(reviews, { stars: null, aspect: 'taste', sort: 'lowest' }),
  ).toHaveLength(2);
  expect(reviews).toEqual(copy);
});
it('counts aspect mentions, most mentioned first', () => {
  expect(aspectCounts(reviews)[0]).toEqual(['taste', 2]);
});
it('falls back to Azerbaijani for unsupported languages', () => {
  expect(catalogLanguage('ru')).toBe('ru');
  expect(catalogLanguage('de')).toBe('az');
});
