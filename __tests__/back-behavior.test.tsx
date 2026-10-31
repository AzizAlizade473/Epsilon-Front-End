import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { render, screen, userEvent } from '@testing-library/react-native';
import { BackHandler } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import TabsLayout from '../app/(tabs)/_layout';
import ScanScreen from '../app/scan';
import az from '../locales/az.json';

import { BackButton } from '@/components/navigation/BackButton';
import { initializeI18n } from '@/lib/i18n';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '@/services/query';
jest.mock('expo-camera', () => ({
  CameraView: () => null,
  useCameraPermissions: () => [null, jest.fn(), mockGetPermission],
}));
const mockGetPermission = jest.fn(() => Promise.resolve(null));
jest.mock('@/features/auth/components/AuthBoundary', () => ({
  AuthBoundary: ({ children }: { children: React.ReactNode }) => children,
}));

const mockBack = jest.fn();
let capturedTabsProps: { backBehavior?: string } | undefined;

jest.mock('expo-router', () => {
  const react = jest.requireActual<typeof import('react')>('react');
  return {
    useRouter: () => ({ back: mockBack, canGoBack: () => true }),
    useFocusEffect: (effect: () => void) => react.useEffect(effect, [effect]),
  };
});

jest.mock('expo-router/js-tabs', () => {
  const MockTabs = (props: { backBehavior?: string }) => {
    capturedTabsProps = props;
    return null;
  };
  MockTabs.displayName = 'MockTabs';
  const MockScreen = () => null;
  MockScreen.displayName = 'MockTabsScreen';
  MockTabs.Screen = MockScreen;
  return { Tabs: MockTabs };
});

const initialMetrics = {
  frame: { x: 0, y: 0, width: 360, height: 640 },
  insets: { top: 24, bottom: 24, left: 0, right: 0 },
};

describe('BackButton component', () => {
  beforeEach(() => {
    mockBack.mockClear();
  });

  it('renders standard back button with localized label and navigates back', async () => {
    await initializeI18n();
    await render(
      <SafeAreaProvider initialMetrics={initialMetrics}>
        <BackButton />
      </SafeAreaProvider>,
    );

    const button = screen.getByRole('button', { name: az.navigation.back });
    expect(button).toBeOnTheScreen();

    const user = userEvent.setup();
    await user.press(button);
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('renders close modal button when modal prop is true', async () => {
    await initializeI18n();
    await render(
      <SafeAreaProvider initialMetrics={initialMetrics}>
        <BackButton modal />
      </SafeAreaProvider>,
    );

    const button = screen.getByRole('button', { name: az.navigation.close });
    expect(button).toBeOnTheScreen();

    const user = userEvent.setup();
    await user.press(button);
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});

describe('Scan modal Back behavior (02.f)', () => {
  beforeEach(() => {
    mockBack.mockClear();
  });

  it('defines close button and closes scan modal on button press', async () => {
    await initializeI18n();
    await render(
      <SafeAreaProvider initialMetrics={initialMetrics}>
        <QueryClientProvider client={createQueryClient()}>
          <ScanScreen />
        </QueryClientProvider>
      </SafeAreaProvider>,
    );

    expect(
      screen.getByRole('header', { name: az.scan.permissionTitle }),
    ).toBeOnTheScreen();
    const closeBtn = screen.getByRole('button', { name: az.navigation.close });
    expect(closeBtn).toBeOnTheScreen();

    const user = userEvent.setup();
    await user.press(closeBtn);
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('closes scan modal on Android hardwareBackPress', async () => {
    await initializeI18n();
    let backListener: (() => void) | undefined;
    const spy = jest
      .spyOn(BackHandler, 'addEventListener')
      .mockImplementation((_event, handler) => {
        backListener = () =>
          handler({ type: 'hardwareBackPress', timeStamp: Date.now() });
        return { remove: jest.fn() };
      });

    await render(
      <SafeAreaProvider initialMetrics={initialMetrics}>
        <QueryClientProvider client={createQueryClient()}>
          <ScanScreen />
        </QueryClientProvider>
      </SafeAreaProvider>,
    );

    expect(backListener).toBeDefined();
    backListener?.();
    expect(mockBack).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});

describe('Tab root Back behavior (02.f)', () => {
  it('Tabs layout configures backBehavior="none" so back exits instead of tab hopping', async () => {
    await initializeI18n();
    await render(
      <SafeAreaProvider initialMetrics={initialMetrics}>
        <TabsLayout />
      </SafeAreaProvider>,
    );
    expect(capturedTabsProps?.backBehavior).toBe('none');
  });
});
