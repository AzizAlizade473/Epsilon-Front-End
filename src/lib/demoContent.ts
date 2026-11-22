import { env } from '@/lib/env';

/**
 * Labelled demo restaurant content (directory, menus, sample reviews, food photos).
 * No public-menu API exists yet, so development and mock builds show this clearly
 * marked catalog instead of an empty Restaurants tab. Production never does (SEC-9):
 * real data only, and an honest empty state until the API exists.
 */
export function demoContent(): boolean {
  return (
    env.EXPO_PUBLIC_APP_ENV !== 'production' &&
    (env.EXPO_PUBLIC_API_MODE === 'mock' ||
      env.EXPO_PUBLIC_APP_ENV === 'development')
  );
}
