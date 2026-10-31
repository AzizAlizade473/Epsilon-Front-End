/**
 * 03.c — Single-flight 401 refresh client wrapper tests (NET-4).
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { z } from 'zod';

import {
  requestWithAuth,
  configureAuthRefresh,
  resetAuthRefresh,
} from '@/services/http/client-with-refresh';
import { setAccessToken, getAccessToken } from '@/services/http/client';

jest.mock('@/lib/env', () => ({
  env: { EXPO_PUBLIC_API_URL: 'https://api.test' },
}));

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

function unauthResponse(): () => Promise<Response> {
  return () =>
    Promise.resolve(
      new Response(JSON.stringify({ code: 'UNAUTHORIZED' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
}

describe('requestWithAuth — single-flight 401 refresh', () => {
  beforeEach(() => {
    resetAuthRefresh();
    setAccessToken('tok_expired');
  });

  it('passes through successful requests without refreshing', async () => {
    const refreshMock = jest.fn<() => Promise<string>>();
    configureAuthRefresh({ refresh: refreshMock, onLogout: null });
    mockFetch([jsonResponse({ ok: true })]);

    const result = await requestWithAuth('GET', '/test', echoSchema);
    expect(result.ok).toBe(true);
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it('refreshes token on 401 and retries original request with new token', async () => {
    const refreshMock = jest
      .fn<() => Promise<string>>()
      .mockResolvedValue('tok_fresh');
    configureAuthRefresh({ refresh: refreshMock, onLogout: null });

    const calls = mockFetch([unauthResponse(), jsonResponse({ ok: true })]);

    const result = await requestWithAuth('GET', '/profile', echoSchema);
    expect(result.ok).toBe(true);
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(getAccessToken()).toBe('tok_fresh');
    expect(calls).toHaveLength(2);
    expect(
      (calls[1]!.options.headers as Record<string, string>)['Authorization'],
    ).toBe('Bearer tok_fresh');
  });

  it('collapses multiple concurrent 401 requests into a single refresh call', async () => {
    let resolveRefresh!: (val: string) => void;
    const refreshPromise = new Promise<string>((res) => {
      resolveRefresh = res;
    });
    const refreshMock = jest
      .fn<() => Promise<string>>()
      .mockImplementation(() => refreshPromise);
    configureAuthRefresh({ refresh: refreshMock, onLogout: null });

    // 2 initial requests that 401, then 2 retries that succeed
    mockFetch([
      unauthResponse(),
      unauthResponse(),
      jsonResponse({ ok: true }),
      jsonResponse({ ok: true }),
    ]);

    const req1 = requestWithAuth('GET', '/req1', echoSchema);
    const req2 = requestWithAuth('GET', '/req2', echoSchema);

    // Give microtasks time to hit the 401 and start refresh
    await Promise.resolve();
    resolveRefresh('tok_fresh');

    const [res1, res2] = await Promise.all([req1, req2]);
    expect(res1.ok).toBe(true);
    expect(res2.ok).toBe(true);
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it('calls onLogout and clears access token when refresh fails', async () => {
    const refreshMock = jest
      .fn<() => Promise<string>>()
      .mockRejectedValue(new Error('Refresh expired'));
    const logoutMock = jest.fn<() => Promise<void>>();
    configureAuthRefresh({ refresh: refreshMock, onLogout: logoutMock });

    mockFetch([unauthResponse()]);

    await expect(
      requestWithAuth('GET', '/profile', echoSchema),
    ).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      status: 401,
    });

    expect(logoutMock).toHaveBeenCalledTimes(1);
    expect(getAccessToken()).toBeNull();
  });

  it('calls onLogout and clears access token when retried request fails with 401 again', async () => {
    const refreshMock = jest
      .fn<() => Promise<string>>()
      .mockResolvedValue('tok_another_expired');
    const logoutMock = jest.fn<() => Promise<void>>();
    configureAuthRefresh({ refresh: refreshMock, onLogout: logoutMock });

    mockFetch([unauthResponse(), unauthResponse()]);

    await expect(
      requestWithAuth('GET', '/profile', echoSchema),
    ).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      status: 401,
    });

    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(logoutMock).toHaveBeenCalledTimes(1);
    expect(getAccessToken()).toBeNull();
  });

  it('re-throws non-401 errors without attempting refresh', async () => {
    const refreshMock = jest.fn<() => Promise<string>>();
    configureAuthRefresh({ refresh: refreshMock, onLogout: null });

    mockFetch([
      () =>
        Promise.resolve(
          new Response(JSON.stringify({ code: 'RATE_LIMITED' }), {
            status: 429,
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
    ]);

    await expect(
      requestWithAuth('GET', '/profile', echoSchema),
    ).rejects.toMatchObject({
      code: 'RATE_LIMITED',
      status: 429,
    });

    expect(refreshMock).not.toHaveBeenCalled();
  });
});
