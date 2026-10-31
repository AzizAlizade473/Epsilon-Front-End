import { beforeEach, expect, it, jest } from '@jest/globals';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import az from '../locales/az.json';
import WelcomeScreen from '@/features/auth/screens/WelcomeScreen';
import { env } from '@/lib/env';
import { initializeI18n } from '@/lib/i18n';

const mockPush = jest.fn();
const mockToast = jest.fn();
jest.mock('@/lib/env', () => ({
  env: {
    ENABLE_GOOGLE_SIGNIN: false,
    ENABLE_APPLE_SIGNIN: false,
    EXPO_PUBLIC_TERMS_URL: 'https://epsilonup.app/terms',
    EXPO_PUBLIC_PRIVACY_URL: 'https://epsilonup.app/privacy',
  },
}));
jest.mock('expo-router', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    useRouter: () => ({ push: mockPush }),
    useFocusEffect: (fn: () => void) => React.useEffect(fn, [fn]),
  };
});
jest.mock('@/providers/ToastProvider', () => ({ useToast: () => mockToast }));
jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));

beforeEach(async () => {
  jest.clearAllMocks();
  env.ENABLE_GOOGLE_SIGNIN = false;
  await initializeI18n();
});
async function welcome() {
  await render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 360, height: 640 },
        insets: { top: 24, bottom: 24, left: 0, right: 0 },
      }}
    >
      <WelcomeScreen />
    </SafeAreaProvider>,
  );
}
it('hides disabled providers and prevents duplicate phone navigation', async () => {
  await welcome();
  expect(
    screen.queryByRole('button', { name: az.auth.continueGoogle }),
  ).toBeNull();
  const phone = screen.getByRole('button', { name: az.auth.continuePhone });
  await fireEvent.press(phone);
  await fireEvent.press(phone);
  expect(mockPush).toHaveBeenCalledTimes(1);
  expect(mockPush).toHaveBeenCalledWith('/phone');
});
it('opens only configured legal links through the system browser surface', async () => {
  await welcome();
  await fireEvent.press(screen.getByRole('link', { name: az.auth.terms }));
  await waitFor(() =>
    expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith(
      env.EXPO_PUBLIC_TERMS_URL,
    ),
  );
  await fireEvent.press(screen.getByRole('link', { name: az.auth.privacy }));
  expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith(
    env.EXPO_PUBLIC_PRIVACY_URL,
  );
});
it('shows the flagged Google option without starting STEP 08 authentication', async () => {
  env.ENABLE_GOOGLE_SIGNIN = true;
  await welcome();
  await fireEvent.press(
    screen.getByRole('button', { name: az.auth.continueGoogle }),
  );
  expect(mockToast).toHaveBeenCalledWith(az.auth.socialUnavailable);
  expect(mockPush).not.toHaveBeenCalled();
});
