import { expect, test } from '@jest/globals';
import { AuthIntentError, requireAuthIntentSupport } from '@/lib/auth-intent';
import { httpAuthService } from '@/services/http/services';

test('legacy auth and explicit supported intent are separate capabilities', () => {
  expect(() => requireAuthIntentSupport()).not.toThrow();
  expect(() => requireAuthIntentSupport('login', true)).not.toThrow();
  expect(() => requireAuthIntentSupport('register')).toThrow(AuthIntentError);
});
test.each(['login', 'register'] as const)(
  'live %s fails before an unsupported auth request',
  async (intent) => {
    await expect(
      httpAuthService.requestOtp({ phone: '+994501234567', intent }),
    ).rejects.toMatchObject({ reason: 'unavailable' });
    await expect(
      httpAuthService.verifyOtp({
        phone: '+994501234567',
        code: '123456',
        intent,
      }),
    ).rejects.toMatchObject({ reason: 'unavailable' });
    await expect(
      httpAuthService.signInWithGoogle({ idToken: 'test-token', intent }),
    ).rejects.toMatchObject({ reason: 'unavailable' });
  },
);
