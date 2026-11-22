import { expect, it } from '@jest/globals';
import { swipeTarget } from '@/components/navigation/TabSwipe';

it('commits by distance or flick velocity, in pill order, never into Scan', () => {
  expect(swipeTarget('home', -100, 0)).toBe('restaurants');
  expect(swipeTarget('restaurants', 100, 0)).toBe('home');
  expect(swipeTarget('restaurants', -10, -900)).toBe('profile');
  expect(swipeTarget('home', 30, 100)).toBeNull();
  expect(swipeTarget('home', 200, 0)).toBeNull();
  expect(swipeTarget('profile', -200, 0)).toBeNull();
  expect(swipeTarget('scan', -200, 0)).toBeNull();
});
