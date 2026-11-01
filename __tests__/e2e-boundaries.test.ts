import { afterEach, expect, it, jest } from '@jest/globals';
import { isE2E } from '@/lib/e2e-mode';
import {
  reportApplicationError,
  setErrorReporter,
} from '@/lib/error-reporting';
import {
  mockAuthService,
  mockWalletService,
  resetMockFeedback,
} from '@/services/mock/services';
import { authResultSchema, walletSchema } from '@/services/contracts';
import { setMockLatency, setMockScenario } from '@/services/mock/scenario';
jest.mock('@/lib/env', () => ({
  env: { EXPO_PUBLIC_APP_ENV: 'development', EXPO_PUBLIC_API_MODE: 'mock' },
}));
const mockEnvironment = jest.requireMock<{
  env: { EXPO_PUBLIC_APP_ENV: string; EXPO_PUBLIC_API_MODE: string };
}>('@/lib/env').env;
afterEach(() => {
  delete process.env.EXPO_PUBLIC_E2E;
  mockEnvironment.EXPO_PUBLIC_APP_ENV = 'development';
  mockEnvironment.EXPO_PUBLIC_API_MODE = 'mock';
  setErrorReporter(null);
});
it('requires explicit opt-in plus development and mock mode', () => {
  expect(isE2E()).toBe(false);
  process.env.EXPO_PUBLIC_E2E = 'true';
  expect(isE2E()).toBe(true);
  mockEnvironment.EXPO_PUBLIC_API_MODE = 'live';
  expect(isE2E()).toBe(false);
  mockEnvironment.EXPO_PUBLIC_API_MODE = 'mock';
  mockEnvironment.EXPO_PUBLIC_APP_ENV = 'production';
  expect(isE2E()).toBe(false);
});
it('cannot enable test controls in an installed release even with an injected flag', () => {
  process.env.EXPO_PUBLIC_E2E = 'true';
  const previous = __DEV__;
  Object.defineProperty(globalThis, '__DEV__', {
    value: false,
    configurable: true,
  });
  try {
    expect(isE2E()).toBe(false);
  } finally {
    Object.defineProperty(globalThis, '__DEV__', {
      value: previous,
      configurable: true,
    });
  }
});
it('returns schema-valid incomplete mock Google onboarding and deterministic OTP failures', async () => {
  process.env.EXPO_PUBLIC_E2E = 'true';
  setMockLatency(0);
  setMockScenario('success');
  resetMockFeedback();
  const auth = authResultSchema.parse(
    await mockAuthService.signInWithGoogle({ idToken: 'maestro-fixture' }),
  );
  expect(auth.nextStep).toBe('profile');
  expect(auth.user.firstName).toBeNull();
  await expect(
    mockAuthService.verifyOtp({ phone: '+994501234567', code: '000000' }),
  ).rejects.toMatchObject({ code: 'OTP_INVALID' });
  await expect(
    mockAuthService.verifyOtp({ phone: '+994501234567', code: '111111' }),
  ).rejects.toMatchObject({ code: 'OTP_EXPIRED' });
  expect(walletSchema.safeParse(await mockWalletService.get()).success).toBe(
    true,
  );
});
it('a monitoring failure cannot throw into application error handling', () => {
  setErrorReporter(() => {
    throw new Error('SDK unavailable');
  });
  expect(() =>
    reportApplicationError(new Error('QR/OTP/private payload')),
  ).not.toThrow();
});
