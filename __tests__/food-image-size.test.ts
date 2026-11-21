import { expect, it, jest } from '@jest/globals';
import { sizedUri } from '@/components/food/FoodImage';

jest.mock('expo-image', () => ({ Image: 'ExpoImage' }));
jest.mock('@/lib/env', () => ({
  env: { EXPO_PUBLIC_APP_ENV: 'development', EXPO_PUBLIC_API_MODE: 'mock' },
}));

it('requests a CDN rendition near the display size', () => {
  const uri = 'https://images.unsplash.com/photo-1?auto=format&w=900&q=80';
  expect(sizedUri(uri, 104, 3)).toContain('w=400');
  expect(sizedUri(uri, 900, 3)).toContain('w=1600');
  expect(sizedUri('https://cdn.example.com/a.jpg', 104, 3)).toBe(
    'https://cdn.example.com/a.jpg',
  );
});
