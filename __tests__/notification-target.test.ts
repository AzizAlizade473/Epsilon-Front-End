import { expect, test } from '@jest/globals';
import { notificationTarget } from '@/components/navigation/NotificationRouter';

test('opens only known in-app destinations and falls back to Home', () => {
  expect(notificationTarget({ path: '/receipt/6b0f5a1e-1111' })).toBe(
    '/receipt/6b0f5a1e-1111',
  );
  expect(notificationTarget({ path: '/restaurant/r_1' })).toBe(
    '/restaurant/r_1',
  );
  expect(notificationTarget({ path: '/scan' })).toBe('/scan');
  for (const path of [
    'https://evil.example',
    '/receipt/../admin',
    '//evil',
    '/settings',
    42,
    null,
  ])
    expect(notificationTarget({ path })).toBe('/home');
  expect(notificationTarget(undefined)).toBe('/home');
});
