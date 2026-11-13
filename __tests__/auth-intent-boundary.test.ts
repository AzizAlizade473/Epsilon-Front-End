import { afterEach, expect, jest, test } from '@jest/globals';
import { AuthIntentError, requireAuthIntentSupport } from '@/lib/auth-intent';
import { httpAuthService } from '@/services/http/services';
import { ApiError } from '@/services/http/errors';
import * as client from '@/services/http/client';

afterEach(() => {
  jest.restoreAllMocks();
});

test('legacy auth and explicit supported intent are separate capabilities', () => {
  expect(() => requireAuthIntentSupport()).not.toThrow();
  expect(() => requireAuthIntentSupport('login', true)).not.toThrow();
  expect(() => requireAuthIntentSupport('register')).toThrow(AuthIntentError);
  expect(httpAuthService.supportsAuthIntent).toBe(true);
});

test.each([
  ['login', 404, 'notFound'],
  ['register', 409, 'exists'],
] as const)(
  'live %s maps backend %i to the %s intent outcome',
  async (intent, status, reason) => {
    const spy = jest
      .spyOn(client, 'request')
      .mockRejectedValue(
        new ApiError({ code: 'UNKNOWN', message: 'x', status }),
      );
    await expect(
      httpAuthService.verifyOtp({
        phone: '+994501234567',
        code: '123456',
        intent,
      }),
    ).rejects.toMatchObject({ reason });
    expect(spy.mock.calls[0]?.[3]).toMatchObject({ intent });
    await expect(
      httpAuthService.signInWithGoogle({ idToken: 'test-token', intent }),
    ).rejects.toMatchObject({ reason });
  },
);

test('typed errors and intent-less calls are not remapped', async () => {
  jest
    .spyOn(client, 'request')
    .mockRejectedValue(
      new ApiError({ code: 'PHONE_IN_USE', message: 'x', status: 409 }),
    );
  await expect(
    httpAuthService.verifyOtp({
      phone: '+994501234567',
      code: '123456',
      intent: 'register',
    }),
  ).rejects.toMatchObject({ code: 'PHONE_IN_USE' });
});
