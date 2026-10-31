import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import type { ReactNode } from 'react';
import az from '../locales/az.json';
import PhoneScreen from '@/features/auth/screens/PhoneScreen';
import OtpScreen from '@/features/auth/screens/OtpScreen';
import {
  AuthProvider,
  useAuth,
  useAuthActions,
} from '@/providers/AuthProvider';
import { Button } from '@/components/ui/Button';
import { registerAuthCleanup } from '@/lib/auth-lifecycle';
import { Text } from '@/components/ui/Text';
import { initializeI18n } from '@/lib/i18n';
import { storageKeys } from '@/lib/bootstrap';
import { authOperation, otpChallenge } from '@/features/auth/store';
import { ApiError } from '@/services/http/errors';
import { getAccessToken } from '@/services/http/client';
import { createQueryClient } from '@/services/query';
import { mockUser } from '@/services/mock/fixtures';
import type { AuthResult, NextStep } from '@/services/contracts';
import { SessionRestore } from '@/components/navigation/SessionRestore';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockToast = jest.fn();
const mockRequest =
  jest.fn<
    (input: {
      phone: string;
    }) => Promise<{ expiresAt: string; retryAfterSeconds: number }>
  >();
const mockVerify =
  jest.fn<(input: { phone: string; code: string }) => Promise<AuthResult>>();
const mockMe = jest.fn<() => Promise<typeof mockUser>>();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: jest.fn() }),
  Redirect: ({ href }: { href: string }) => {
    mockReplace(href);
    return null;
  },
}));
jest.mock('@/providers/ToastProvider', () => ({ useToast: () => mockToast }));
jest.mock('@/lib/env', () => ({
  env: { EXPO_PUBLIC_API_URL: 'https://api.test' },
}));
jest.mock('@/services', () => ({
  services: {
    user: { me: () => mockMe() },
    config: { get: async () => ({ requirePhoneVerification: true }) },
    auth: {
      logout: async () => undefined,
      requestOtp: (input: { phone: string }) => mockRequest(input),
      verifyOtp: (input: { phone: string; code: string }) => mockVerify(input),
    },
  },
}));

const session = {
  accessToken: 'test-access',
  refreshToken: 'test-refresh',
  expiresAt: '2027-01-01T00:00:00Z',
};
const result = (nextStep: NextStep = 'home'): AuthResult => ({
  session,
  user: mockUser,
  nextStep,
  isNewUser: false,
});
function StateProbe() {
  const auth = useAuth();
  return (
    <Text testID="auth-state">
      {auth.session ? auth.user?.firstName : 'signed-out'}
    </Text>
  );
}
function ActionProbe() {
  const { completeSignIn, logout } = useAuthActions();
  return (
    <>
      <Button
        label="Test sign in"
        onPress={() => {
          void completeSignIn(result());
        }}
      />
      <Button
        label="Test sign out"
        onPress={() => {
          void logout();
        }}
      />
    </>
  );
}
function RestoreProbe() {
  const auth = useAuth();
  if (auth.restoreStatus)
    return (
      <SessionRestore
        failed={auth.restoreStatus === 'error'}
        onRetry={() => auth.retryRestore?.()}
      />
    );
  return <Text testID="restored-user">{auth.user?.firstName}</Text>;
}
function Wrapper({ children }: { children: ReactNode }) {
  return (
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 360, height: 640 },
        insets: { top: 24, bottom: 24, left: 0, right: 0 },
      }}
    >
      <QueryClientProvider client={createQueryClient()}>
        <AuthProvider boot={{ session: null, onboardingComplete: false }}>
          {children}
          <StateProbe />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
beforeEach(async () => {
  jest.clearAllMocks();
  authOperation.release();
  authOperation.limit(0);
  otpChallenge.clear();
  mockRequest.mockReset();
  mockVerify.mockReset();
  mockMe.mockReset();
  mockMe.mockResolvedValue(mockUser);
  mockRequest.mockResolvedValue({
    expiresAt: '2027-01-01T00:00:00Z',
    retryAfterSeconds: 60,
  });
  mockVerify.mockResolvedValue(result());
  jest.mocked(SecureStore.setItemAsync).mockResolvedValue(undefined);
  await initializeI18n();
});

describe('Phone → OTP → session', () => {
  it('logout deletes the secure session and clears auth state and registered provider/OTP state', async () => {
    const cleanup = jest.fn<() => void>();
    const unregister = registerAuthCleanup(cleanup);
    await render(<ActionProbe />, { wrapper: Wrapper });
    await fireEvent.press(screen.getByRole('button', { name: 'Test sign in' }));
    await waitFor(() => expect(getAccessToken()).toBe(session.accessToken));
    otpChallenge.set('+994501234567', 60, 'link');
    await fireEvent.press(
      screen.getByRole('button', { name: 'Test sign out' }),
    );
    await waitFor(() =>
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
        storageKeys.session,
      ),
    );
    expect(getAccessToken()).toBeNull();
    expect(otpChallenge.get()).toBeNull();
    expect(screen.getByTestId('auth-state')).toHaveTextContent('signed-out');
    expect(cleanup).toHaveBeenCalledTimes(1);
    unregister();
  });
  it('hydrates a boot session from the service without reading tokens from storage again', async () => {
    await render(
      <QueryClientProvider client={createQueryClient()}>
        <AuthProvider boot={{ session, onboardingComplete: true }}>
          <RestoreProbe />
        </AuthProvider>
      </QueryClientProvider>,
      {
        wrapper: ({ children }) => (
          <SafeAreaProvider
            initialMetrics={{
              frame: { x: 0, y: 0, width: 360, height: 640 },
              insets: { top: 0, bottom: 0, left: 0, right: 0 },
            }}
          >
            {children}
          </SafeAreaProvider>
        ),
      },
    );
    await waitFor(() =>
      expect(screen.getByTestId('restored-user')).toHaveTextContent(
        mockUser.firstName ?? '',
      ),
    );
    expect(SecureStore.getItemAsync).not.toHaveBeenCalledWith(
      storageKeys.session,
    );
    expect(getAccessToken()).toBe(session.accessToken);
  });

  it('allows recovery after a session hydration network failure', async () => {
    mockMe.mockRejectedValueOnce(new Error('offline'));
    await render(
      <QueryClientProvider client={createQueryClient()}>
        <AuthProvider boot={{ session, onboardingComplete: true }}>
          <RestoreProbe />
        </AuthProvider>
      </QueryClientProvider>,
      {
        wrapper: ({ children }) => (
          <SafeAreaProvider
            initialMetrics={{
              frame: { x: 0, y: 0, width: 360, height: 640 },
              insets: { top: 0, bottom: 0, left: 0, right: 0 },
            }}
          >
            {children}
          </SafeAreaProvider>
        ),
      },
    );
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(az.errors.generic),
    );
    await fireEvent.press(
      screen.getByRole('button', { name: az.common.retry }),
    );
    await waitFor(() =>
      expect(screen.getByTestId('restored-user')).toHaveTextContent(
        mockUser.firstName ?? '',
      ),
    );
  });
  it('normalizes paste, prevents double requests and navigates without phone params', async () => {
    let finish: (value: {
      expiresAt: string;
      retryAfterSeconds: number;
    }) => void = () => {};
    mockRequest.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    await render(<PhoneScreen />, { wrapper: Wrapper });
    expect(
      screen.getByRole('button', { name: az.auth.sendCode }),
    ).toBeDisabled();
    await fireEvent.changeText(
      screen.getByLabelText(az.auth.phoneLabel),
      '+994501234567',
    );
    await fireEvent.press(
      screen.getByRole('button', { name: az.auth.sendCode }),
    );
    await fireEvent.press(
      screen.getByRole('button', { name: az.auth.sendCode }),
    );
    expect(mockRequest).toHaveBeenCalledTimes(1);
    expect(mockRequest).toHaveBeenCalledWith({ phone: '+994501234567' });
    await act(async () =>
      finish({ expiresAt: '2027-01-01T00:00:00Z', retryAfterSeconds: 60 }),
    );
    expect(mockPush).toHaveBeenCalledWith('/otp');
  });

  it.each<NextStep>(['profile', 'phone', 'home'])(
    'persists and publishes server session before routing to %s',
    async (nextStep) => {
      mockVerify.mockResolvedValue(result(nextStep));
      otpChallenge.set('+994501234567', 60);
      await render(<OtpScreen />, { wrapper: Wrapper });
      await fireEvent.changeText(
        screen.getByLabelText(az.auth.codeLabel),
        '12345',
      );
      expect(mockVerify).not.toHaveBeenCalled();
      await fireEvent.changeText(
        screen.getByLabelText(az.auth.codeLabel),
        '123456',
      );
      await waitFor(() =>
        expect(mockReplace).toHaveBeenCalledWith(
          { profile: '/profile-setup', phone: '/phone-verify', home: '/home' }[
            nextStep
          ],
        ),
      );
      expect(mockVerify).toHaveBeenCalledTimes(1);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        storageKeys.session,
        JSON.stringify(session),
      );
      expect(getAccessToken()).toBe(session.accessToken);
      expect(screen.getByTestId('auth-state')).toHaveTextContent(
        mockUser.firstName ?? '',
      );
      expect(otpChallenge.get()).toBeNull();
    },
  );

  it('keeps the form locked during verification and waits for secure persistence', async () => {
    let save: () => void = () => {};
    jest.mocked(SecureStore.setItemAsync).mockImplementation(async (key) => {
      if (key === storageKeys.session)
        await new Promise<void>((resolve) => {
          save = resolve;
        });
    });
    otpChallenge.set('+994501234567', 60);
    await render(<OtpScreen />, { wrapper: Wrapper });
    await fireEvent.changeText(
      screen.getByLabelText(az.auth.codeLabel),
      '123456',
    );
    expect(screen.getByLabelText(az.auth.codeLabel)).toHaveProp(
      'editable',
      false,
    );
    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockVerify).toHaveBeenCalledTimes(1);
    await act(async () => save());
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/home'));
  });

  it.each(['OTP_INVALID', 'OTP_EXPIRED', 'OTP_TOO_MANY', 'NETWORK'] as const)(
    'handles %s without authenticating',
    async (code) => {
      mockVerify.mockRejectedValue(
        new ApiError({
          code,
          message: 'server detail must not render',
          status: 400,
          retryAfterSeconds: 30,
        }),
      );
      otpChallenge.set('+994501234567', 60);
      await render(<OtpScreen />, { wrapper: Wrapper });
      await fireEvent.changeText(
        screen.getByLabelText(az.auth.codeLabel),
        '123456',
      );
      await waitFor(() =>
        expect(screen.getByLabelText(az.auth.codeLabel)).toHaveProp(
          'value',
          '',
        ),
      );
      expect(mockReplace).not.toHaveBeenCalled();
      expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
      if (code === 'NETWORK')
        expect(mockToast).toHaveBeenCalledWith(az.errors.network);
      else
        expect(screen.getByRole('alert')).toHaveTextContent(
          code === 'OTP_INVALID'
            ? az.auth.otpInvalid
            : code === 'OTP_EXPIRED'
              ? az.auth.otpExpired
              : az.auth.tooMany,
        );
      if (code === 'OTP_TOO_MANY')
        expect(screen.getByLabelText(az.auth.codeLabel)).toHaveProp(
          'editable',
          false,
        );
    },
  );

  it('does not navigate or publish a session when secure saving fails', async () => {
    jest
      .mocked(SecureStore.setItemAsync)
      .mockRejectedValue(new Error('secure storage unavailable'));
    otpChallenge.set('+994501234567', 60);
    await render(<OtpScreen />, { wrapper: Wrapper });
    await fireEvent.changeText(
      screen.getByLabelText(az.auth.codeLabel),
      '123456',
    );
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(az.errors.generic),
    );
    expect(mockReplace).not.toHaveBeenCalled();
    expect(getAccessToken()).toBeNull();
  });

  it('rejects a direct OTP visit without an in-memory challenge', async () => {
    await render(<OtpScreen />, { wrapper: Wrapper });
    expect(mockReplace).toHaveBeenCalledWith('/phone');
    expect(mockVerify).not.toHaveBeenCalled();
  });
});
