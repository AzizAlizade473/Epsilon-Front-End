/**
 * 03.b — HTTP client tests.
 *
 * Covers: timeout, network error, BAD_RESPONSE (schema mismatch + non-JSON),
 * server error code mapping, GET retry on NETWORK/TIMEOUT,
 * Authorization header, Idempotency-Key header, and successful Zod parse.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { z } from 'zod';

import {
  request,
  setAccessToken,
  setLocaleAccessor,
  getAccessToken,
} from '@/services/http/client';
import { ApiError } from '@/services/http/errors';
import { generateIdempotencyKey } from '@/services/http/idempotency';

// ---------------------------------------------------------------------------
// Mock env
// ---------------------------------------------------------------------------

jest.mock('@/lib/env', () => ({
  env: { EXPO_PUBLIC_API_URL: 'https://api.test' },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const echoSchema = z.object({ ok: z.boolean() });

type FetchCall = {
  url: string;
  options: RequestInit;
};

function mockFetch(responses: (() => Promise<Response>)[]): FetchCall[] {
  const calls: FetchCall[] = [];
  let callIndex = 0;
  globalThis.fetch = jest.fn(
    async (url: RequestInfo | URL, options?: RequestInit) => {
      calls.push({ url: String(url), options: options ?? {} });
      const handler = responses[callIndex];
      callIndex += 1;
      if (!handler) throw new Error('Unexpected fetch call');
      return handler();
    },
  ) as typeof fetch;
  return calls;
}

function jsonResponse(body: unknown, status = 200): () => Promise<Response> {
  return () =>
    Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
}

function networkError(): () => Promise<Response> {
  return () => Promise.reject(new TypeError('Failed to fetch'));
}

function abortError(): () => Promise<Response> {
  return () =>
    Promise.reject(
      Object.assign(new DOMException('Aborted', 'AbortError'), {}),
    );
}

it.each([15, 120])(
  'carries server OTP lockout duration %s to the UI',
  async (retryAfterSeconds) => {
    mockFetch([jsonResponse({ code: 'OTP_TOO_MANY', retryAfterSeconds }, 429)]);
    await expect(
      request(
        'POST',
        '/auth/otp/verify',
        echoSchema,
        {},
        { idempotencyKey: 'test-lockout' },
      ),
    ).rejects.toMatchObject({ code: 'OTP_TOO_MANY', retryAfterSeconds });
  },
);

it('reads numeric Retry-After when the error body has no duration', async () => {
  mockFetch([
    async () =>
      new Response(JSON.stringify({ code: 'RATE_LIMITED' }), {
        status: 429,
        headers: { 'Retry-After': '45' },
      }),
  ]);
  await expect(
    request(
      'POST',
      '/auth/otp/request',
      echoSchema,
      {},
      { idempotencyKey: 'test-retry-after' },
    ),
  ).rejects.toMatchObject({ code: 'RATE_LIMITED', retryAfterSeconds: 45 });
});

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  setAccessToken(null);
  setLocaleAccessor(() => 'az');
  jest.useFakeTimers();
});

// ---------------------------------------------------------------------------
// Success path
// ---------------------------------------------------------------------------

describe('request — success', () => {
  it('returns parsed data on 200', async () => {
    mockFetch([jsonResponse({ ok: true })]);
    jest.useRealTimers();
    const result = await request('GET', '/test', echoSchema);
    expect(result.ok).toBe(true);
  });

  it('attaches Bearer token when set', async () => {
    setAccessToken('tok_abc');
    const calls = mockFetch([jsonResponse({ ok: true })]);
    jest.useRealTimers();
    await request('GET', '/test', echoSchema);
    expect(
      (calls[0]!.options.headers as Record<string, string>)['Authorization'],
    ).toBe('Bearer tok_abc');
  });

  it('attaches Accept-Language header', async () => {
    setLocaleAccessor(() => 'en');
    const calls = mockFetch([jsonResponse({ ok: true })]);
    jest.useRealTimers();
    await request('GET', '/test', echoSchema);
    expect(
      (calls[0]!.options.headers as Record<string, string>)['Accept-Language'],
    ).toBe('en');
  });

  it('attaches Idempotency-Key when provided', async () => {
    const calls = mockFetch([jsonResponse({ ok: true })]);
    jest.useRealTimers();
    await request(
      'POST',
      '/test',
      echoSchema,
      { data: 1 },
      {
        idempotencyKey: 'key-123',
      },
    );
    expect(
      (calls[0]!.options.headers as Record<string, string>)['Idempotency-Key'],
    ).toBe('key-123');
  });

  it('does NOT attach Idempotency-Key when absent', async () => {
    const calls = mockFetch([jsonResponse({ ok: true })]);
    jest.useRealTimers();
    await request('POST', '/test', echoSchema, { data: 1 });
    expect(
      (calls[0]!.options.headers as Record<string, string>)['Idempotency-Key'],
    ).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// BAD_RESPONSE
// ---------------------------------------------------------------------------

describe('request — BAD_RESPONSE', () => {
  it('throws BAD_RESPONSE when response body fails Zod schema', async () => {
    mockFetch([jsonResponse({ wrong: 'shape' })]);
    jest.useRealTimers();
    await expect(request('GET', '/test', echoSchema)).rejects.toMatchObject({
      code: 'BAD_RESPONSE',
      status: 200,
    });
  });

  it('throws BAD_RESPONSE when response body is not JSON', async () => {
    mockFetch([
      () =>
        Promise.resolve(
          new Response('not json', {
            status: 200,
            headers: { 'Content-Type': 'text/plain' },
          }),
        ),
    ]);
    jest.useRealTimers();
    await expect(request('GET', '/test', echoSchema)).rejects.toMatchObject({
      code: 'BAD_RESPONSE',
    });
  });
});

// ---------------------------------------------------------------------------
// Error mapping
// ---------------------------------------------------------------------------

describe('request — server error codes', () => {
  it('throws with server error code from body', async () => {
    mockFetch([
      jsonResponse({ code: 'RECEIPT_NOT_FOUND', message: 'Not found' }, 404),
    ]);
    jest.useRealTimers();
    await expect(request('GET', '/test', echoSchema)).rejects.toMatchObject({
      code: 'RECEIPT_NOT_FOUND',
      status: 404,
    });
  });

  it('falls back to UNAUTHORIZED for 401 with no body code', async () => {
    mockFetch([() => Promise.resolve(new Response('', { status: 401 }))]);
    jest.useRealTimers();
    await expect(request('GET', '/test', echoSchema)).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      status: 401,
    });
  });

  it('falls back to RATE_LIMITED for 429', async () => {
    mockFetch([() => Promise.resolve(new Response('', { status: 429 }))]);
    jest.useRealTimers();
    await expect(request('GET', '/test', echoSchema)).rejects.toMatchObject({
      code: 'RATE_LIMITED',
      status: 429,
    });
  });

  it('falls back to UNKNOWN for unrecognised status', async () => {
    mockFetch([() => Promise.resolve(new Response('', { status: 503 }))]);
    jest.useRealTimers();
    await expect(request('GET', '/test', echoSchema)).rejects.toMatchObject({
      code: 'UNKNOWN',
      status: 503,
    });
  });
});

// ---------------------------------------------------------------------------
// Network / timeout errors
// ---------------------------------------------------------------------------

describe('request — network and timeout errors', () => {
  it('throws NETWORK on fetch TypeError', async () => {
    mockFetch([networkError()]);
    jest.useRealTimers();
    await expect(request('GET', '/test', echoSchema)).rejects.toMatchObject({
      code: 'NETWORK',
      status: 0,
    });
  });

  it('throws TIMEOUT on AbortError', async () => {
    mockFetch([abortError(), abortError(), abortError()]);
    jest.useRealTimers();
    await expect(request('GET', '/test', echoSchema)).rejects.toMatchObject({
      code: 'TIMEOUT',
      status: 0,
    });
  });
});

// ---------------------------------------------------------------------------
// GET retry (NET-2)
// ---------------------------------------------------------------------------

describe('request — GET retry', () => {
  it('retries GET on NETWORK error and succeeds on second attempt', async () => {
    const calls = mockFetch([networkError(), jsonResponse({ ok: true })]);
    jest.useRealTimers();
    const result = await request('GET', '/retry-test', echoSchema);
    expect(result.ok).toBe(true);
    expect(calls).toHaveLength(2);
  });

  it('retries GET on TIMEOUT and succeeds on second attempt', async () => {
    const calls = mockFetch([abortError(), jsonResponse({ ok: true })]);
    jest.useRealTimers();
    const result = await request('GET', '/retry-test', echoSchema);
    expect(result.ok).toBe(true);
    expect(calls).toHaveLength(2);
  });

  it('fails after max GET retries', async () => {
    mockFetch([networkError(), networkError(), networkError()]);
    jest.useRealTimers();
    await expect(
      request('GET', '/retry-test', echoSchema),
    ).rejects.toMatchObject({
      code: 'NETWORK',
    });
  });

  it('does NOT retry POST mutations', async () => {
    const calls = mockFetch([networkError()]);
    jest.useRealTimers();
    await expect(
      request('POST', '/mutate', echoSchema, {}),
    ).rejects.toMatchObject({ code: 'NETWORK' });
    expect(calls).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// ApiError helpers
// ---------------------------------------------------------------------------

describe('ApiError', () => {
  it('isUserFacing returns true for OTP_INVALID', () => {
    const err = new ApiError({
      code: 'OTP_INVALID',
      message: 'bad otp',
      status: 422,
    });
    expect(err.isUserFacing()).toBe(true);
  });

  it('isUserFacing returns false for NETWORK', () => {
    const err = new ApiError({ code: 'NETWORK', message: 'net', status: 0 });
    expect(err.isUserFacing()).toBe(false);
  });

  it('isUserFacing returns false for BAD_RESPONSE', () => {
    const err = new ApiError({
      code: 'BAD_RESPONSE',
      message: 'bad',
      status: 200,
    });
    expect(err.isUserFacing()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// generateIdempotencyKey
// ---------------------------------------------------------------------------

describe('generateIdempotencyKey', () => {
  it('includes the prefix', () => {
    const key = generateIdempotencyKey('otp-request');
    expect(key.startsWith('otp-request-')).toBe(true);
  });

  it('generates unique keys', () => {
    const a = generateIdempotencyKey('test');
    const b = generateIdempotencyKey('test');
    expect(a).not.toBe(b);
  });
});

// ---------------------------------------------------------------------------
// setAccessToken / getAccessToken
// ---------------------------------------------------------------------------

describe('token store', () => {
  it('stores and retrieves an access token', () => {
    setAccessToken('my-token');
    expect(getAccessToken()).toBe('my-token');
  });

  it('clears the token when set to null', () => {
    setAccessToken('tok');
    setAccessToken(null);
    expect(getAccessToken()).toBeNull();
  });
});
