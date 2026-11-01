import { env } from './env';
/** Explicit opt-in test seam; never usable by an installed release or live service. */
export function isE2E() {
  return (
    __DEV__ &&
    process.env.EXPO_PUBLIC_E2E === 'true' &&
    env.EXPO_PUBLIC_APP_ENV === 'development' &&
    env.EXPO_PUBLIC_API_MODE === 'mock'
  );
}
