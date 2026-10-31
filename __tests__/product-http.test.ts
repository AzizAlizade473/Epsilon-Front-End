import { beforeEach, expect, it, jest } from '@jest/globals';
import {
  httpRestaurantService,
  httpWalletService,
} from '@/services/http/services';
import { mockRestaurants, mockWallet } from '@/services/mock/fixtures';
import { request } from '@/services/http/client';
import { walletSchema } from '@/services/contracts';

jest.mock('@/lib/env', () => ({
  env: { EXPO_PUBLIC_API_URL: 'https://api.test' },
}));
const fetchMock = jest.fn<typeof fetch>();
beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});
function respond(body: unknown) {
  fetchMock.mockResolvedValueOnce(
    new Response(JSON.stringify(body), { status: 200 }),
  );
}
it('normalizes legacy restaurant arrays and validates cursor pages at the boundary', async () => {
  respond(mockRestaurants);
  expect((await httpRestaurantService.list()).items).toHaveLength(3);
  respond({ items: [mockRestaurants[0]], nextCursor: 'page two/+' });
  expect(
    (
      await httpRestaurantService.list({
        cursor: 'page one/+',
        search: 'Demo restoran',
        limit: 20,
      })
    ).nextCursor,
  ).toBe('page two/+');
  expect(String(fetchMock.mock.calls[1]?.[0])).toContain(
    'cursor=page+one%2F%2B',
  );
  respond({ items: [{ id: 'bad' }], nextCursor: null });
  await expect(httpRestaurantService.list()).rejects.toMatchObject({
    code: 'BAD_RESPONSE',
  });
});
it('keeps malformed wallet amounts out of the view', async () => {
  respond({ ...mockWallet, balanceMinor: 1.5 });
  await expect(httpWalletService.get()).rejects.toMatchObject({
    code: 'BAD_RESPONSE',
  });
});
it('does not fetch or retry an already cancelled query', async () => {
  const controller = new AbortController();
  controller.abort();
  await expect(
    request('GET', '/wallet', walletSchema, undefined, {
      signal: controller.signal,
    }),
  ).rejects.toMatchObject({ name: 'AbortError' });
  expect(fetchMock).not.toHaveBeenCalled();
});
