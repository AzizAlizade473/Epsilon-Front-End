import { beforeEach, expect, it, jest } from '@jest/globals';
import {
  httpFeedbackService,
  httpNotificationService,
  httpUserService,
  httpWalletService,
} from '@/services/http/services';
import { mockUser, mockTransactions } from '@/services/mock/fixtures';
jest.mock('@/lib/env', () => ({
  env: { EXPO_PUBLIC_API_URL: 'https://api.test' },
}));
const fetchMock = jest.fn<typeof fetch>();
beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});
const respond = (value: unknown) =>
  fetchMock.mockResolvedValueOnce(
    new Response(JSON.stringify(value), { status: 200 }),
  );
it('reads canonical profile and review data and rejects reward-only records as reviews', async () => {
  respond(mockUser);
  await httpUserService.me();
  expect(fetchMock.mock.calls[0]?.[0]).toBe('https://api.test/me');
  respond({
    items: [
      { feedbackId: 'fb', reward: { status: 'none', amountMinor: null } },
    ],
    nextCursor: null,
  });
  await expect(httpFeedbackService.list()).rejects.toMatchObject({
    code: 'BAD_RESPONSE',
  });
  respond({
    items: [
      {
        feedbackId: 'fb',
        dishName: 'Dish',
        restaurantName: 'Demo',
        rating: 1,
        comment: null,
        createdAt: new Date().toISOString(),
      },
    ],
    nextCursor: null,
  });
  expect(
    (await httpFeedbackService.list({ cursor: 'next/+ ', limit: 20 })).items[0]
      ?.rating,
  ).toBe(1);
  expect(String(fetchMock.mock.calls[2]?.[0])).toContain('cursor=next%2F%2B+');
});
it('confirms notification writes with a validated server response and idempotency', async () => {
  const preferences = { cashbackUpdates: true, partnerUpdates: false };
  respond(preferences);
  expect(
    await httpNotificationService.updatePreferences(preferences, {
      idempotencyKey: 'stable-settings',
    }),
  ).toEqual(preferences);
  const [url, request] = fetchMock.mock.calls[0]!;
  expect(url).toBe('https://api.test/me/notification-settings');
  expect(request?.method).toBe('PUT');
  expect(new Headers(request?.headers).get('Idempotency-Key')).toBe(
    'stable-settings',
  );
  respond({ cashbackUpdates: 'yes', partnerUpdates: false });
  await expect(httpNotificationService.preferences()).rejects.toMatchObject({
    code: 'BAD_RESPONSE',
  });
});
it('never fabricates a missing transaction and keeps integer amounts validated', async () => {
  respond({ ...mockTransactions[0], amountMinor: 0.5 });
  await expect(httpWalletService.transaction('tx_01')).rejects.toMatchObject({
    code: 'BAD_RESPONSE',
  });
  fetchMock.mockResolvedValueOnce(
    new Response(JSON.stringify({ code: 'UNKNOWN' }), { status: 404 }),
  );
  await expect(httpWalletService.transaction('missing')).rejects.toMatchObject({
    status: 404,
  });
});
it('deletes only through the backend mutation, with a reusable key', async () => {
  fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
  await httpUserService.deleteAccount({ idempotencyKey: 'stable-delete' });
  const [url, init] = fetchMock.mock.calls[0]!;
  expect(url).toBe('https://api.test/me');
  expect(init?.method).toBe('DELETE');
  expect(new Headers(init?.headers).get('Idempotency-Key')).toBe(
    'stable-delete',
  );
});
