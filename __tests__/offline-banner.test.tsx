import NetInfo, { NetInfoStateType } from '@react-native-community/netinfo';
import { afterEach, expect, jest, test } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import az from '../locales/az.json';

import { OfflineBanner } from '@/components/feedback/OfflineBanner';
import { Text } from '@/components/ui/Text';
import { initializeI18n } from '@/lib/i18n';

afterEach(() => {
  jest.restoreAllMocks();
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
