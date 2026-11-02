import NetInfo, {
  NetInfoStateType,
  type NetInfoState,
} from '@react-native-community/netinfo';
import { afterEach, expect, jest, test } from '@jest/globals';
import { act, render, screen } from '@testing-library/react-native';
import { onlineManager } from '@tanstack/react-query';
import { layout } from '@/design';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import az from '../locales/az.json';

import { OfflineBanner } from '@/components/feedback/OfflineBanner';
import { Text } from '@/components/ui/Text';
import { initializeI18n } from '@/lib/i18n';

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test('web connection stays online when unsupported reachability is synthetic false', async () => {
  await initializeI18n();
  jest.replaceProperty(Platform, 'OS', 'web');
  jest
    .spyOn(globalThis, 'requestAnimationFrame')
    .mockImplementation((callback) => {
      callback(0);
      return 1;
    });
  jest.spyOn(NetInfo, 'addEventListener').mockImplementation((listener) => {
    listener({
      type: NetInfoStateType.other,
      isConnected: true,
      isInternetReachable: false,
      details: { isConnectionExpensive: false },
    });
    return () => {};
  });
  await render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 0, bottom: 0, left: 0, right: 0 },
      }}
    >
      <OfflineBanner>
        <Text>Content</Text>
      </OfflineBanner>
    </SafeAreaProvider>,
  );
  expect(screen.queryByRole('alert')).toBeNull();
  expect(onlineManager.isOnline()).toBe(true);
});
test.each([false, true])(
  'network state offline=%s leaves screen content usable',
  async (offline) => {
    await initializeI18n();
    jest
      .spyOn(globalThis, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        callback(0);
        return 1;
      });
    jest.spyOn(NetInfo, 'addEventListener').mockImplementation((listener) => {
      listener({
        type: NetInfoStateType.unknown,
        isConnected: !offline,
        isInternetReachable: null,
        details: null,
      });
      return () => {};
    });
    const metrics = {
      frame: { x: 0, y: 0, width: 360, height: 640 },
      insets: { top: 24, bottom: 24, left: 0, right: 0 },
    };
    await render(
      <SafeAreaProvider initialMetrics={metrics}>
        <OfflineBanner>
          <Text>Content</Text>
        </OfflineBanner>
      </SafeAreaProvider>,
    );
    expect(screen.getByText('Content')).toBeOnTheScreen();
    expect(Boolean(screen.queryByText(az.navigation.offline))).toBe(offline);
  },
);

test('unknown connectivity does not hide offline status; recovery is announced then dismissed', async () => {
  await initializeI18n();
  jest.useFakeTimers();
  jest
    .spyOn(globalThis, 'requestAnimationFrame')
    .mockImplementation((callback) => {
      callback(0);
      return 1;
    });
  let notify: (state: NetInfoState) => void = () => {};
  jest.spyOn(NetInfo, 'addEventListener').mockImplementation((listener) => {
    notify = listener;
    return () => {};
  });
  await render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 360, height: 640 },
        insets: { top: 24, bottom: 24, left: 0, right: 0 },
      }}
    >
      <OfflineBanner>
        <Text>Content</Text>
      </OfflineBanner>
    </SafeAreaProvider>,
  );
  const state = (connected: boolean | null): NetInfoState => ({
    type: NetInfoStateType.unknown,
    isConnected: connected,
    isInternetReachable: null,
    details: null,
  });
  await act(() => notify(state(false)));
  expect(screen.getByRole('alert')).toHaveTextContent(az.navigation.offline);
  expect(onlineManager.isOnline()).toBe(false);
  await act(() => notify(state(null)));
  expect(screen.getByRole('alert')).toHaveTextContent(az.navigation.offline);
  expect(onlineManager.isOnline()).toBe(false);
  await act(() => notify(state(true)));
  expect(screen.getByRole('alert')).toHaveTextContent(
    az.resilience.reconnected,
  );
  expect(onlineManager.isOnline()).toBe(true);
  await act(() => jest.advanceTimersByTime(layout.reconnectDuration));
  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.getByText('Content')).toBeOnTheScreen();
});
