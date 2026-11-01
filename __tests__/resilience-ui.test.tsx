import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { QueryClientProvider, onlineManager } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Linking } from 'react-native';
import { ToastProvider, useToast } from '@/providers/ToastProvider';
import { AppErrorBoundary } from '@/components/feedback/AppErrorBoundary';
import { UpdateGate } from '@/components/feedback/UpdateGate';
import { OfflineBanner } from '@/components/feedback/OfflineBanner';
import { SessionExpiryNavigation } from '@/components/navigation/SessionExpiryNavigation';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { initializeI18n } from '@/lib/i18n';
import { setErrorReporter } from '@/lib/error-reporting';
import { notifySessionExpired } from '@/lib/runtime-notices';
import { clearAuthFlows } from '@/lib/auth-lifecycle';
import { createQueryClient, queryKeys } from '@/services/query';
import type { Config } from '@/services/contracts';
import az from '../locales/az.json';
const mockConfig = jest.fn<() => Promise<Config>>();
const mockReplace = jest.fn();
const mockDismiss = jest.fn();
const mockRouter = { replace: mockReplace, dismissAll: mockDismiss };
let mockNetwork:
  | ((state: { isConnected: boolean; isInternetReachable: boolean }) => void)
  | undefined;
jest.mock('@react-native-community/netinfo', () => ({
  configure: jest.fn(),
  addEventListener: (listener: typeof mockNetwork) => {
    mockNetwork = listener;
    return jest.fn();
  },
}));
jest.mock('@/services', () => ({
  services: { config: { get: () => mockConfig() } },
}));
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useRootNavigationState: () => ({ key: 'root' }),
}));
const client = createQueryClient();
beforeEach(async () => {
  jest.clearAllMocks();
  client.clear();
  mockConfig.mockReset().mockResolvedValue({
    minAppVersion: '0.1.0',
    minAge: 16,
    requirePhoneVerification: true,
  });
  await initializeI18n();
});
afterEach(() => {
  client.clear();
  jest.useRealTimers();
  jest.restoreAllMocks();
  setErrorReporter(null);
  onlineManager.setOnline(true);
});
async function page(child: React.ReactNode) {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 360, height: 640 },
        insets: { top: 24, bottom: 24, left: 0, right: 0 },
      }}
    >
      <QueryClientProvider client={client}>
        <ToastProvider>{child}</ToastProvider>
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
}
it('queues one visible toast, clears old messages on logout and routes expiry to Welcome', async () => {
  function Probe() {
    const toast = useToast();
    return (
      <Button
        label="Queue"
        onPress={() => {
          toast('First');
          toast('Second');
        }}
      />
    );
  }
  await page(
    <>
      <Probe />
      <SessionExpiryNavigation />
    </>,
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Queue' }));
  expect(screen.getByText('First')).toBeOnTheScreen();
  expect(screen.queryByText('Second')).toBeNull();
  await fireEvent.press(
    screen.getByRole('button', { name: az.navigation.close }),
  );
  expect(screen.getByText('Second')).toBeOnTheScreen();
  await act(async () => {
    await clearAuthFlows();
    notifySessionExpired();
  });
  expect(screen.queryByText('Second')).toBeNull();
  expect(screen.getByText(az.resilience.sessionExpired)).toBeOnTheScreen();
  expect(mockReplace).toHaveBeenCalledWith('/welcome');
});
it('pauses/resumes queries and hides reconnect feedback after repeated online notifications', async () => {
  jest.useFakeTimers();
  await page(
    <OfflineBanner>
      <Text>Cached</Text>
    </OfflineBanner>,
  );
  await act(async () => {
    jest.runOnlyPendingTimers();
  });
  await act(() =>
    mockNetwork?.({ isConnected: false, isInternetReachable: false }),
  );
  expect(onlineManager.isOnline()).toBe(false);
  expect(screen.getByText('Cached')).toBeOnTheScreen();
  await act(() => {
    mockNetwork?.({ isConnected: true, isInternetReachable: true });
    mockNetwork?.({ isConnected: true, isInternetReachable: true });
  });
  expect(onlineManager.isOnline()).toBe(true);
  expect(screen.getByText(az.resilience.reconnected)).toBeOnTheScreen();
  await act(async () => {
    jest.advanceTimersByTime(1600);
  });
  expect(screen.queryByText(az.resilience.reconnected)).toBeNull();
});
it('recovers a throwing child without displaying its sensitive error message', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
  const reporter = jest.fn();
  setErrorReporter(reporter);
  let broken = true;
  function Child() {
    if (broken) throw new Error('private phone payload');
    return <Text>Recovered</Text>;
  }
  await page(
    <AppErrorBoundary>
      <Child />
    </AppErrorBoundary>,
  );
  expect(screen.queryByText('private phone payload')).toBeNull();
  expect(reporter).toHaveBeenCalledTimes(1);
  broken = false;
  await fireEvent.press(
    screen.getByRole('button', { name: az.resilience.reload }),
  );
  expect(screen.getByText('Recovered')).toBeOnTheScreen();
});
it('blocks unsupported versions with only a trusted Play Store destination, including cached offline state', async () => {
  const open = jest.spyOn(Linking, 'openURL').mockResolvedValue();
  client.setQueryData(queryKeys.config.current(), {
    minAppVersion: '0.2.0',
    minAge: 16,
    requirePhoneVerification: true,
  });
  await page(
    <UpdateGate currentVersion="0.1.0" storePackage="com.epsilonup.app">
      <Text>Protected content</Text>
    </UpdateGate>,
  );
  expect(screen.queryByText('Protected content')).toBeNull();
  await fireEvent.press(
    screen.getByRole('button', { name: az.resilience.updateAction }),
  );
  expect(open).toHaveBeenCalledWith(
    'https://play.google.com/store/apps/details?id=com.epsilonup.app',
  );
  await act(() => onlineManager.setOnline(false));
  expect(screen.queryByText('Protected content')).toBeNull();
});
it('does not trap an offline user in a pending configuration spinner', async () => {
  onlineManager.setOnline(false);
  await page(
    <UpdateGate currentVersion="0.1.0">
      <Text>Cached interface</Text>
    </UpdateGate>,
  );
  await waitFor(() =>
    expect(screen.getByText('Cached interface')).toBeOnTheScreen(),
  );
});
