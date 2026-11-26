import { env } from '@/lib/env';

/**
 * Demo restaurant content (directory, menus, sample reviews, food photos).
 * No public-menu API exists yet, so development and mock builds show this
 * catalog instead of an empty Restaurants tab, as do builds that set
 * EXPO_PUBLIC_DEMO_CATALOG (partner presentations). Production never does (SEC-9):
 * real data only, and an honest empty state until the API exists.
 */
export function demoContent(): boolean {
  return (
    env.EXPO_PUBLIC_APP_ENV !== 'production' &&
    (env.EXPO_PUBLIC_DEMO_CATALOG ||
      env.EXPO_PUBLIC_API_MODE === 'mock' ||
      env.EXPO_PUBLIC_APP_ENV === 'development')
  );
}
