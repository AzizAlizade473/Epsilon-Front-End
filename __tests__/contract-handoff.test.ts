import { afterEach, expect, it, jest } from '@jest/globals';
import { z } from 'zod';
import { request, setAccessToken } from '@/services/http/client';
import { httpAuthService } from '@/services/http/services';
import { mockUser } from '@/services/mock/fixtures';
import { mockServices, resetMockFeedback } from '@/services/mock/services';
import { setMockLatency, setMockScenario } from '@/services/mock/scenario';
import {
  authResultSchema,
  configSchema,
  feedbackResultSchema,
  feedbackReviewSchema,
  notificationPreferencesSchema,
  otpChallengeSchema,
  paginatedSchema,
  profileUpdateResultSchema,
  receiptSchema,
  restaurantSchema,
  sessionSchema,
  userSchema,
  walletSchema,
  walletTransactionSchema,
} from '@/services/contracts';
jest.mock('@/lib/env', () => ({
  env: { EXPO_PUBLIC_API_URL: 'https://api.test/v1' },
}));
const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
  setAccessToken(null);
  setMockScenario('success');
  resetMockFeedback();
});
it.each([
  [
    {
      error: {
        code: 'OTP_EXPIRED',
        message: 'Expired',
        requestId: 'synthetic-request',
      },
    },
    400,
    'OTP_EXPIRED',
  ],
  [
    { error: { code: 'NEW_UNRECOGNIZED_CODE', message: 'Do not parse' } },
    403,
    'UNKNOWN',
  ],
  [{ error: { code: 'NETWORK' } }, 500, 'UNKNOWN'],
] as const)(
  'decodes canonical errors and refuses arbitrary/client-only server codes',
  async (body, status, code) => {
    globalThis.fetch = jest.fn(
      async () => new Response(JSON.stringify(body), { status }),
    ) as typeof fetch;
    await expect(
      request(
        'POST',
        '/test',
        z.object({ ok: z.boolean() }),
        {},
        { idempotencyKey: 'synthetic-key' },
      ),
    ).rejects.toMatchObject({ code, status });
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  },
);
it('honors header request IDs and rejects unsafe Retry-After values', async () => {
  globalThis.fetch = jest.fn(
    async () =>
      new Response(
        JSON.stringify({
          error: { code: 'RATE_LIMITED', requestId: 'body-id' },
        }),
        {
          status: 429,
          headers: {
            'Retry-After': '9999999999999999999999',
            'X-Request-Id': 'header-id',
          },
        },
      ),
  ) as typeof fetch;
  await expect(
    request('POST', '/test', z.null(), {}, { idempotencyKey: 'synthetic-key' }),
  ).rejects.toMatchObject({ requestId: 'header-id', retryAfterSeconds: null });
});
it('uses authenticated canonical phone-link routes with mutation keys', async () => {
  setAccessToken('synthetic-session');
  const calls: { url: string; options?: RequestInit }[] = [];
  globalThis.fetch = jest.fn(
    async (url: RequestInfo | URL, options?: RequestInit) => {
      calls.push({ url: String(url), options });
      return new Response(
        JSON.stringify(
          String(url).endsWith('/request')
            ? { expiresAt: '2030-01-01T00:00:00Z', retryAfterSeconds: 60 }
            : mockUser,
        ),
        { status: 200 },
      );
    },
  ) as typeof fetch;
  await httpAuthService.requestPhoneLinkOtp({ phone: '+994501234567' });
  await httpAuthService.verifyPhoneLink({
    phone: '+994501234567',
    code: '123456',
  });
  expect(calls.map((call) => call.url)).toEqual([
    'https://api.test/v1/me/phone/otp/request',
    'https://api.test/v1/me/phone/otp/verify',
  ]);
  for (const call of calls)
    expect(call.options?.headers).toMatchObject({
      Authorization: 'Bearer synthetic-session',
      'Idempotency-Key': expect.any(String),
    });
});
it('rejects contradictory reward status/amount responses', () => {
  expect(
    feedbackResultSchema.safeParse({
      feedbackId: 'synthetic-feedback',
      reward: { status: 'none', amountMinor: 250 },
    }).success,
  ).toBe(false);
  expect(
    feedbackResultSchema.safeParse({
      feedbackId: 'synthetic-feedback',
      reward: { status: 'confirmed', amountMinor: null },
    }).success,
  ).toBe(false);
});
it('validates every implemented mock response family, including generated projections', async () => {
  setMockLatency(0);
  setMockScenario('success');
  resetMockFeedback();
  expect(configSchema.safeParse(await mockServices.config.get()).success).toBe(
    true,
  );
  expect(
    otpChallengeSchema.safeParse(
      await mockServices.auth.requestOtp({ phone: '+994501234567' }),
    ).success,
  ).toBe(true);
  expect(
    authResultSchema.safeParse(
      await mockServices.auth.verifyOtp({
        phone: '+994501234567',
        code: '123456',
      }),
    ).success,
  ).toBe(true);
  expect(
    authResultSchema.safeParse(
      await mockServices.auth.signInWithGoogle({
        idToken: 'synthetic-provider-value',
      }),
    ).success,
  ).toBe(true);
  expect(
    sessionSchema.safeParse(
      await mockServices.auth.refresh({
        refreshToken: 'synthetic-refresh-value',
      }),
    ).success,
  ).toBe(true);
  expect(
    otpChallengeSchema.safeParse(
      await mockServices.auth.requestPhoneLinkOtp({ phone: '+994501234567' }),
    ).success,
  ).toBe(true);
  expect(
    userSchema.safeParse(
      await mockServices.auth.verifyPhoneLink({
        phone: '+994501234567',
        code: '123456',
      }),
    ).success,
  ).toBe(true);
  expect(userSchema.safeParse(await mockServices.user.me()).success).toBe(true);
  expect(
    profileUpdateResultSchema.safeParse(
      await mockServices.user.updateProfile({ firstName: 'Synthetic' }),
    ).success,
  ).toBe(true);
  const restaurants = await mockServices.restaurant.list({ limit: 50 });
  expect(paginatedSchema(restaurantSchema).safeParse(restaurants).success).toBe(
    true,
  );
  expect(
    restaurantSchema.safeParse(
      await mockServices.restaurant.get(restaurants.items[0]!.id),
    ).success,
  ).toBe(true);
  const receipt = receiptSchema.parse(
    await mockServices.receipt.resolve({ kind: 'code', value: 'SYNTHETIC' }),
  );
  expect(
    receiptSchema.safeParse(await mockServices.receipt.get(receipt.id)).success,
  ).toBe(true);
  for (const [index, item] of receipt.items.entries()) {
    setMockScenario(
      index === 0
        ? 'feedback_pending'
        : index === 1
          ? 'feedback_none'
          : 'success',
    );
    expect(
      feedbackResultSchema.safeParse(
        await mockServices.feedback.submit(
          { receiptItemId: item.id, rating: 4 },
          { idempotencyKey: `synthetic-${index}` },
        ),
      ).success,
    ).toBe(true);
  }
  setMockScenario('wallet_long_history');
  expect(walletSchema.safeParse(await mockServices.wallet.get()).success).toBe(
    true,
  );
  const page = await mockServices.wallet.transactions({ limit: 50 });
  expect(paginatedSchema(walletTransactionSchema).safeParse(page).success).toBe(
    true,
  );
  expect(
    walletTransactionSchema.safeParse(
      await mockServices.wallet.transaction(page.items[0]!.id),
    ).success,
  ).toBe(true);
  expect(
    paginatedSchema(feedbackReviewSchema).safeParse(
      await mockServices.feedback.list(),
    ).success,
  ).toBe(true);
  expect(
    notificationPreferencesSchema.safeParse(
      await mockServices.notification.settings(),
    ).success,
  ).toBe(true);
  expect(
    notificationPreferencesSchema.safeParse(
      await mockServices.notification.updatePreferences({
        cashbackUpdates: false,
        partnerUpdates: true,
      }),
    ).success,
  ).toBe(true);
});
