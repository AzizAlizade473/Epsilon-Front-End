import { beforeEach, expect, it, jest } from '@jest/globals';
import {
  httpReceiptService,
  httpFeedbackService,
} from '@/services/http/services';
import { mockReceipt } from '@/services/mock/fixtures';
jest.mock('@/lib/env', () => ({
  env: { EXPO_PUBLIC_API_URL: 'https://api.test' },
}));
const fetchMock = jest.fn<typeof fetch>();
beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});
it('posts opaque QR references only in the body with an idempotency key', async () => {
  const value = 'https://untrusted.test/claim?secret=opaque';
  fetchMock.mockResolvedValueOnce(
    new Response(JSON.stringify(mockReceipt), { status: 200 }),
  );
  await httpReceiptService.resolve(
    { kind: 'qr', value },
    { idempotencyKey: 'stable-resolve' },
  );
  const [url, init] = fetchMock.mock.calls[0]!;
  expect(url).toBe('https://api.test/receipts/resolve');
  expect(init?.method).toBe('POST');
  expect(JSON.parse(String(init?.body))).toEqual({ kind: 'qr', value });
  expect(new Headers(init?.headers).get('Idempotency-Key')).toBe(
    'stable-resolve',
  );
});
it('posts the durable feedback key and rejects malformed server rewards', async () => {
  fetchMock.mockResolvedValueOnce(
    new Response(
      JSON.stringify({
        feedbackId: 'fb',
        reward: { status: 'confirmed', amountMinor: null },
      }),
      { status: 200 },
    ),
  );
  await expect(
    httpFeedbackService.submit(
      { receiptItemId: 'item', rating: 1 },
      { idempotencyKey: 'stable-feedback' },
    ),
  ).rejects.toMatchObject({ code: 'BAD_RESPONSE' });
  expect(
    new Headers(fetchMock.mock.calls[0]?.[1]?.headers).get('Idempotency-Key'),
  ).toBe('stable-feedback');
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
