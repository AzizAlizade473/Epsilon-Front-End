import { env } from './env';

// Local browser review only. Never persist credentials in localStorage/cookies
// or silently replace native SecureStore for a live/production application.
const values = new Map<string, string>();
function assertMockPreview() {
  if (
    !__DEV__ ||
    env.EXPO_PUBLIC_APP_ENV !== 'development' ||
    env.EXPO_PUBLIC_API_MODE !== 'mock'
  ) {
    values.clear();
    throw new Error(
      'Browser session storage is restricted to development mock previews',
    );
  }
}
export async function getItemAsync(key: string): Promise<string | null> {
  assertMockPreview();
  return values.get(key) ?? null;
}
export async function setItemAsync(key: string, value: string): Promise<void> {
  assertMockPreview();
  values.set(key, value);
}
export async function deleteItemAsync(key: string): Promise<void> {
  assertMockPreview();
  values.delete(key);
}
