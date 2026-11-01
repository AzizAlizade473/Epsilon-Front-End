import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { act, render } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CrashRuntime } from '@/providers/CrashRuntime';
import { saveCrashConsent } from '@/lib/preferences';
import { clearAuthFlows } from '@/lib/auth-lifecycle';
const mockConfigure = jest.fn(
  async (_policy: { consent: boolean }) => undefined,
);
const mockStop = jest.fn();
jest.mock('@/lib/crash-reporting', () => ({
  createCrashController: () => ({ configure: mockConfigure, stop: mockStop }),
}));
jest.mock('@/providers/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'account' } }),
}));
jest.mock('@/lib/env', () => ({
  env: {
    EXPO_PUBLIC_SENTRY_DSN: 'https://public@o1.ingest.sentry.io/1',
    EXPO_PUBLIC_APP_ENV: 'production',
    ENABLE_CRASH_REPORTING_DEV: false,
  },
}));
beforeEach(async () => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  await AsyncStorage.clear();
});
afterEach(() => {
  jest.useRealTimers();
});
it('waits for the frame boundary, honors stored consent and disables immediately on opt-out/logout', async () => {
  await AsyncStorage.setItem('epsilon.preferences.account', 'true');
  await render(<CrashRuntime />);
  expect(mockConfigure).not.toHaveBeenCalled();
  await act(async () => {
    jest.runAllTimers();
  });
  expect(mockConfigure).toHaveBeenCalledWith(
    expect.objectContaining({ consent: true }),
  );
  await act(async () => {
    await saveCrashConsent('account', false);
  });
  expect(mockStop).toHaveBeenCalled();
  expect(mockConfigure).toHaveBeenLastCalledWith(
    expect.objectContaining({ consent: false }),
  );
  await act(async () => {
    await clearAuthFlows();
  });
  expect(await AsyncStorage.getItem('epsilon.preferences.account')).toBeNull();
});
