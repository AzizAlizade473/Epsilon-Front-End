import { expect, jest, test } from '@jest/globals';
import { QueryClient } from '@tanstack/react-query';
import { billParams, noBillFilters } from '@/hooks/billFilters';
import { dishLike, likeDestination } from '@/hooks/likeTargets';
import { setLike } from '@/hooks/useLikes';
import { sortDishes } from '@/features/home/exploreFeed';
import { services } from '@/services';
import type { LikeResult } from '@/services/contracts';
import { queryKeys } from '@/services/query';

const mockLike = jest.fn<() => Promise<LikeResult>>();
jest.mock('@/services', () => ({
  services: {
    get like() {
      return { like: mockLike, unlike: mockLike };
    },
  },
}));

const target = dishLike('rest_01', 'dish_1', 'Plov', 'Nar');
const key = queryKeys.likes.state('dish', target.targetId);

test('a like shows at once, ignores repeat taps and keeps the server answer', async () => {
  const client = new QueryClient();
  client.setQueryData(key, { liked: false, count: 2 });
  let answer!: (value: LikeResult) => void;
  mockLike.mockImplementation(() => new Promise((done) => (answer = done)));
  const first = setLike(client, target, true);
  await Promise.resolve(setLike(client, target, true));
  await new Promise((done) => setTimeout(done, 0));
  expect(client.getQueryData(key)).toEqual({ liked: true, count: 3 });
  answer({ liked: true, count: 4 });
  await first;
  expect(mockLike).toHaveBeenCalledTimes(1);
  expect(client.getQueryData(key)).toEqual({ liked: true, count: 4 });
  expect(services.like).toBeDefined();
  client.clear();
});

test('a failed like rolls back', async () => {
  const client = new QueryClient();
  client.setQueryData(key, { liked: false, count: 2 });
  mockLike.mockRejectedValue(new Error('offline'));
  await expect(setLike(client, target, true)).rejects.toThrow('offline');
  expect(client.getQueryData(key)).toEqual({ liked: false, count: 2 });
  client.clear();
});

test('a liked item opens its screen; a broken reference does not', () => {
  const item = {
    kind: 'dish' as const,
    targetId: target.targetId,
    ...target.snapshot,
    createdAt: '2026-11-26T00:00:00.000Z',
    count: 1,
  };
  expect(likeDestination(item)).toEqual({
    pathname: '/restaurant/[id]/dish/[dishId]',
    params: { id: 'rest_01', dishId: 'dish_1' },
  });
  expect(likeDestination({ ...item, dishId: null })).toBeNull();
});

test('bill search and filters combine; a reversed range is repaired', () => {
  const now = Date.parse('2026-11-26T21:00:00Z'); // already the 27th in Baku
  expect(billParams('  ', noBillFilters, now)).toEqual({});
  expect(
    billParams(
      ' kfc ',
      { ...noBillFilters, date: 'week', partner: 'no', cashback: 'none' },
      now,
    ),
  ).toEqual({ q: 'kfc', from: '2026-11-21', partner: false, cashback: 'none' });
  expect(
    billParams(
      '',
      {
        ...noBillFilters,
        date: 'custom',
        from: '2026-11-20',
        to: '2026-11-10',
      },
      now,
    ),
  ).toEqual({ from: '2026-11-10', to: '2026-11-20' });
});

test('most mentioned filters and sorts by the real mention counts', () => {
  const dish = (key: string, taste: number, average: number) => ({
    key,
    kind: 'dish' as const,
    title: key,
    subtitle: '',
    imageUrl: null,
    rating: { average, count: 10 },
    mentions: taste ? { taste } : {},
    target: {
      pathname: '/restaurant/[id]/dish/[dishId]' as const,
      id: 'r',
      dishId: key,
    },
  });
  const all = [dish('a', 1, 5), dish('b', 7, 3), dish('c', 0, 4)];
  const keys = (items: { key: string }[]) => items.map((i) => i.key);
  expect(keys(sortDishes(all, 'mentioned', null))).toEqual(['b', 'a', 'c']);
  expect(keys(sortDishes(all, 'mentioned', 'taste'))).toEqual(['b', 'a']);
  expect(keys(sortDishes(all, 'rated', 'taste'))).toEqual(['a', 'b']);
});
