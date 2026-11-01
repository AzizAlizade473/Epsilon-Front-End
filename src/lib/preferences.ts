import AsyncStorage from '@react-native-async-storage/async-storage';
import { authOperation, registerAuthCleanup } from './auth-lifecycle';
const prefix = 'epsilon.preferences.';
const listeners = new Set<(owner: string | null, value: boolean) => void>();
export function onCrashConsentChange(
  listener: (owner: string | null, value: boolean) => void,
) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
function notify(owner: string | null, value: boolean) {
  listeners.forEach((listener) => listener(owner, value));
}
let pending: Promise<unknown> = Promise.resolve();
function serial<T>(operation: () => Promise<T>) {
  const next = pending.catch(() => undefined).then(operation);
  pending = next;
  return next;
}
export function readCrashConsent(owner: string) {
  return serial(
    async () => (await AsyncStorage.getItem(prefix + owner)) === 'true',
  );
}
export function saveCrashConsent(owner: string, value: boolean) {
  const epoch = authOperation.epoch();
  if (!value) notify(owner, false);
  return serial(async () => {
    if (!authOperation.current(epoch)) throw new Error('Session unavailable');
    await AsyncStorage.setItem(prefix + owner, String(value));
    if (authOperation.current(epoch)) notify(owner, value);
  });
}
export function clearPreferences() {
  notify(null, false);
  return serial(async () => {
    const keys = (await AsyncStorage.getAllKeys()).filter((key) =>
      key.startsWith(prefix),
    );
    await AsyncStorage.multiRemove(keys);
  });
}
registerAuthCleanup(clearPreferences);
