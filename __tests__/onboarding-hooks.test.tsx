import { beforeEach, expect, it, jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';
import { googleDriver } from '@/lib/google-signin';
import { authOperation, clearAuthFlows } from '@/lib/auth-lifecycle';
import { useGoogleSignIn } from '@/features/auth/hooks/useGoogleSignIn';
import { usePhoneAuth } from '@/features/auth/hooks/usePhoneAuth';
import { otpChallenge } from '@/features/auth/store';
import { initializeI18n } from '@/lib/i18n';
import { mockUser } from '@/services/mock/fixtures';
import { ApiError } from '@/services/http/errors';
import type { AuthResult } from '@/services/contracts';
import az from '../locales/az.json';

const mockComplete = jest.fn(async (_result: AuthResult) => {});
const mockUpdate = jest.fn((_user: typeof mockUser) => '/home');
const mockGoogle =
  jest.fn<(input: { idToken: string }) => Promise<AuthResult>>();
const mockRequestLink = jest.fn(async (_input: { phone: string }) => ({
  retryAfterSeconds: 60,
  expiresAt: '2027-01-01T00:00:00Z',
}));
const mockVerifyLink = jest.fn(
  async (_input: { phone: string; code: string }) => mockUser,
);
const mockVerifySignIn = jest.fn();
jest.mock('@/providers/AuthProvider', () => ({
  useAuthActions: () => ({
    completeSignIn: mockComplete,
    updateUser: mockUpdate,
  }),
}));
jest.mock('@/providers/ToastProvider', () => ({ useToast: () => jest.fn() }));
jest.mock('@/lib/env', () => ({ env: { ENABLE_GOOGLE_SIGNIN: false } }));
jest.mock('@/services', () => ({
  services: {
    auth: {
      signInWithGoogle: (input: { idToken: string }) => mockGoogle(input),
      requestPhoneLinkOtp: (input: { phone: string }) => mockRequestLink(input),
      verifyPhoneLink: (input: { phone: string; code: string }) =>
        mockVerifyLink(input),
      verifyOtp: (...args: unknown[]) => mockVerifySignIn(...args),
    },
  },
}));
const result: AuthResult = {
  session: {
    accessToken: 'test-access',
    refreshToken: 'test-refresh',
    expiresAt: '2027-01-01T00:00:00Z',
  },
  user: mockUser,
  nextStep: 'profile',
  isNewUser: true,
};
beforeEach(async () => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
  authOperation.release();
  authOperation.limit(0);
  otpChallenge.clear();
  mockGoogle.mockReset().mockResolvedValue(result);
  mockVerifyLink.mockReset().mockResolvedValue(mockUser);
  jest
    .spyOn(googleDriver, 'exchange')
    .mockImplementation(async (send) => send('test-id-token'));
  await initializeI18n();
});
it('prevents concurrent Google flows and routes using backend nextStep after saving', async () => {
  let finish: (value: AuthResult) => void = () => {};
  mockGoogle.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const { result: hook } = await renderHook(useGoogleSignIn);
  let first: ReturnType<typeof hook.current.signIn> = Promise.resolve(null);
  await act(async () => {
    first = hook.current.signIn();
    await hook.current.signIn();
  });
  expect(mockGoogle).toHaveBeenCalledTimes(1);
  expect(hook.current.busy).toBe(true);
  await act(async () => finish(result));
  expect(await first).toBe('/profile-setup');
  expect(mockComplete).toHaveBeenCalledWith(result);
});
it.each([
  'SOCIAL_TOKEN_INVALID',
  'SOCIAL_EMAIL_UNVERIFIED',
  'NETWORK',
] as const)('does not authenticate on backend %s', async (code) => {
  mockGoogle.mockRejectedValue(
    new ApiError({ code, message: 'private detail', status: 400 }),
  );
  const { result: hook } = await renderHook(useGoogleSignIn);
  await act(async () => {
    expect(await hook.current.signIn()).toBeNull();
  });
  expect(mockComplete).not.toHaveBeenCalled();
  expect(hook.current.error).toBe(
    code === 'SOCIAL_EMAIL_UNVERIFIED'
      ? az.onboarding.googleUnverified
      : code === 'NETWORK'
        ? az.onboarding.googleNetwork
        : az.onboarding.googleFailed,
  );
});
it('cancels silently and restores the sign-in controls', async () => {
  jest.spyOn(googleDriver, 'exchange').mockResolvedValue(null);
  const { result: hook } = await renderHook(useGoogleSignIn);
  await act(async () => {
    await hook.current.signIn();
  });
  expect(hook.current.busy).toBe(false);
  expect(hook.current.error).toBeUndefined();
  expect(mockComplete).not.toHaveBeenCalled();
});
it('ignores a late Google response after logout invalidates the flow', async () => {
  let finish: (value: AuthResult) => void = () => {};
  mockGoogle.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const { result: hook } = await renderHook(useGoogleSignIn);
  let first = Promise.resolve<string | null>(null);
  await act(async () => {
    first = hook.current.signIn();
  });
  await act(async () => {
    await clearAuthFlows();
    finish(result);
    await first;
  });
  expect(mockComplete).not.toHaveBeenCalled();
});
it('links a phone using authenticated endpoints and updates the existing account', async () => {
  const { result: hook } = await renderHook(() => usePhoneAuth('link'));
  await act(async () => {
    expect(await hook.current.requestCode('0501234567')).toBe(true);
  });
  expect(mockRequestLink).toHaveBeenCalledWith({ phone: '+994501234567' });
  await act(async () => {
    expect(await hook.current.verifyCode('123456')).toBe('/home');
  });
  expect(mockVerifyLink).toHaveBeenCalledWith({
    phone: '+994501234567',
    code: '123456',
  });
  expect(mockUpdate).toHaveBeenCalledWith(mockUser);
  expect(mockVerifySignIn).not.toHaveBeenCalled();
  expect(mockComplete).not.toHaveBeenCalled();
});
it('rejects a sign-in challenge on the phone-link endpoint and surfaces PHONE_IN_USE without merging', async () => {
  const { result: hook } = await renderHook(() => usePhoneAuth('link'));
  otpChallenge.set('+994501234567', 0, 'signIn');
  await act(async () => {
    expect(await hook.current.verifyCode('123456')).toBeNull();
  });
  expect(mockVerifyLink).not.toHaveBeenCalled();
  otpChallenge.set('+994501234567', 0, 'link');
  mockVerifyLink.mockRejectedValue(
    new ApiError({ code: 'PHONE_IN_USE', message: 'private', status: 409 }),
  );
  await act(async () => {
    await hook.current.verifyCode('123456');
  });
  expect(hook.current.phoneInUse).toBe(true);
  expect(mockUpdate).not.toHaveBeenCalled();
});
