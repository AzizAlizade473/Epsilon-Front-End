import { beforeEach, expect, it, jest } from '@jest/globals';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import az from '../locales/az.json';
import AuthEntryScreen from '@/features/auth/screens/AuthEntryScreen';
import { initializeI18n } from '@/lib/i18n';
import { env } from '@/lib/env';
import { authOperation, otpChallenge } from '@/features/auth/store';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockGoogle = jest.fn<() => Promise<'/profile-setup' | null>>();
const mockRequest =
  jest.fn<() => Promise<{ expiresAt: string; retryAfterSeconds: number }>>();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    canGoBack: () => false,
  }),
}));
jest.mock('@/providers/AuthProvider', () => ({ useAuthActions: () => ({}) }));
jest.mock('@/providers/ToastProvider', () => ({ useToast: () => jest.fn() }));
jest.mock('@/services', () => ({
  services: { auth: { requestOtp: () => mockRequest() } },
}));
jest.mock('@/features/auth/hooks/useGoogleSignIn', () => ({
  useGoogleSignIn: () => ({ busy: false, signIn: mockGoogle }),
}));
jest.mock('@/lib/env', () => ({ env: { ENABLE_GOOGLE_SIGNIN: true } }));

beforeEach(async () => {
  jest.clearAllMocks();
  authOperation.release();
  authOperation.limit(0);
  otpChallenge.clear();
  env.ENABLE_GOOGLE_SIGNIN = true;
  mockGoogle.mockResolvedValue('/profile-setup');
  mockRequest.mockResolvedValue({
    expiresAt: '2027-01-01T00:00:00Z',
    retryAfterSeconds: 60,
  });
  await initializeI18n('az');
});
async function entry(intent: 'login' | 'register') {
  await render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 360, height: 640 },
        insets: { top: 24, bottom: 24, left: 0, right: 0 },
      }}
    >
      <AuthEntryScreen intent={intent} />
    </SafeAreaProvider>,
  );
}
it.each(['login', 'register'] as const)(
  '%s keeps intent and links to its counterpart',
  async (intent) => {
    await entry(intent);
    expect(
      screen.getByRole('header', { name: az.authEntry[intent] }),
    ).toBeOnTheScreen();
    expect(
      screen.getByText(
        intent === 'login'
          ? az.authEntry.loginHelper
          : az.authEntry.registerHelper,
      ),
    ).toBeOnTheScreen();
    const target = intent === 'login' ? 'register' : 'login';
    await fireEvent.press(
      screen.getByRole('link', { name: az.authEntry[target] }),
    );
    expect(mockReplace).toHaveBeenCalledWith(`/${target}`);
  },
);
it.each(['login', 'register'] as const)(
  '%s email state cannot submit or request authentication',
  async (intent) => {
    await entry(intent);
    await fireEvent.press(
      screen.getByRole('radio', { name: az.authEntry.email }),
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      az.authEntry.emailUnavailable,
    );
    expect(screen.queryByLabelText(az.auth.phoneLabel)).toBeNull();
    expect(
      screen.queryByRole('button', { name: az.common.continue }),
    ).toBeNull();
    expect(mockRequest).not.toHaveBeenCalled();
    expect(mockGoogle).not.toHaveBeenCalled();
    await fireEvent.press(
      screen.getByRole('radio', { name: az.authEntry.phone }),
    );
    expect(screen.getByLabelText(az.auth.phoneLabel)).toBeOnTheScreen();
  },
);
it.each(['login', 'register'] as const)(
  '%s requests only the canonical phone challenge and routes without PII',
  async (intent) => {
    await entry(intent);
    expect(
      screen.getByRole('button', { name: az.common.continue }),
    ).toBeDisabled();
    await fireEvent.changeText(
      screen.getByLabelText(az.auth.phoneLabel),
      '+994501234567',
    );
    await fireEvent.press(
      screen.getByRole('button', { name: az.common.continue }),
    );
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/otp'));
    expect(mockRequest).toHaveBeenCalledTimes(1);
    expect(otpChallenge.get()?.phone).toBe('+994501234567');
  },
);
it.each(['login', 'register'] as const)(
  '%s uses the existing Google result routing',
  async (intent) => {
    await entry(intent);
    await fireEvent.press(
      screen.getByRole('button', { name: az.auth.continueGoogle }),
    );
    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith('/profile-setup'),
    );
    expect(mockGoogle).toHaveBeenCalledTimes(1);
  },
);
it('represents disabled Google honestly and direct-entry Back returns to Welcome', async () => {
  env.ENABLE_GOOGLE_SIGNIN = false;
  await entry('login');
  expect(
    screen.getByRole('button', { name: az.auth.continueGoogle }),
  ).toBeDisabled();
  expect(screen.getByText(az.authEntry.googleUnavailable)).toBeOnTheScreen();
  await fireEvent.press(
    screen.getByRole('button', { name: az.navigation.back }),
  );
  expect(mockReplace).toHaveBeenCalledWith('/welcome');
  expect(mockGoogle).not.toHaveBeenCalled();
});
