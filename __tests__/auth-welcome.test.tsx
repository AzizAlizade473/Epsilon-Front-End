import { beforeEach, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import az from '../locales/az.json';
import WelcomeScreen from '@/features/auth/screens/WelcomeScreen';
import { env } from '@/lib/env';
import { initializeI18n } from '@/lib/i18n';

const mockPush = jest.fn();
const mockToast = jest.fn();
const mockSignIn = jest.fn<() => Promise<null>>().mockResolvedValue(null);
jest.mock('@/features/auth/hooks/useGoogleSignIn', () => ({
  useGoogleSignIn: () => ({ busy: false, signIn: mockSignIn }),
}));
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
it.each(['login', 'register'] as const)(
  'opens %s once from Welcome',
  async (intent) => {
    await welcome();
    expect(
      screen.queryByRole('button', { name: az.auth.continueGoogle }),
    ).toBeNull();
    const phone = screen.getByRole('button', { name: az.authEntry[intent] });
    await fireEvent.press(phone);
    await fireEvent.press(phone);
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith(`/${intent}`);
  },
);
it.each(['terms', 'privacy'] as const)(
  'opens bundled %s without launching an external browser',
  async (type) => {
    await welcome();
    const link = screen.getByRole('link', { name: az.auth[type] });
    await fireEvent.press(link);
    await fireEvent.press(link);
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith(`/legal/${type}`);
  },
);
it('keeps Google on dedicated entry screens even when enabled', async () => {
  env.ENABLE_GOOGLE_SIGNIN = true;
  await welcome();
  expect(
    screen.queryByRole('button', { name: az.auth.continueGoogle }),
  ).toBeNull();
  expect(
    screen.getByRole('button', { name: az.authEntry.login }),
  ).toBeOnTheScreen();
  expect(
    screen.getByRole('button', { name: az.authEntry.register }),
  ).toBeOnTheScreen();
  expect(mockSignIn).not.toHaveBeenCalled();
  expect(mockPush).not.toHaveBeenCalled();
});
