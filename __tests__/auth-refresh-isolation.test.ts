import { afterEach, expect, it, jest } from '@jest/globals';
import { z } from 'zod';
import { waitFor } from '@testing-library/react-native';
import { clearAuthFlows } from '@/lib/auth-lifecycle';
import { getAccessToken, setAccessToken } from '@/services/http/client';
import {
  configureAuthRefresh,
  requestWithAuth,
  resetAuthRefresh,
} from '@/services/http/client-with-refresh';
jest.mock('@/lib/env', () => ({
  env: { EXPO_PUBLIC_API_URL: 'https://api.test' },
}));
const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
  resetAuthRefresh();
  setAccessToken(null);
});
function deferred<T = string>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
it('a delayed old-token 401 reuses the rotated token without another refresh', async () => {
  const late = deferred<Response>();
  const refresh = jest.fn(async () => 'fresh-token');
  setAccessToken('old-token');
  configureAuthRefresh({ refresh, onLogout: null });
  globalThis.fetch = jest.fn(
    async (url: RequestInfo | URL, options?: RequestInit) => {
      if (
        (options?.headers as Record<string, string>).Authorization ===
        'Bearer fresh-token'
      )
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      if (String(url).endsWith('/late')) return late.promise;
      return new Response(JSON.stringify({ code: 'UNAUTHORIZED' }), {
        status: 401,
      });
    },
  ) as typeof fetch;
  const first = requestWithAuth('GET', '/first', z.object({ ok: z.boolean() }));
  const second = requestWithAuth('GET', '/late', z.object({ ok: z.boolean() }));
  await first;
  late.resolve(
    new Response(JSON.stringify({ code: 'UNAUTHORIZED' }), { status: 401 }),
  );
  await expect(second).resolves.toEqual({ ok: true });
  expect(refresh).toHaveBeenCalledTimes(1);
});
it('an obsolete account refresh cannot clear the new account single-flight or publish its token', async () => {
  const old = deferred();
  const next = deferred();
  const urls: string[] = [];
  globalThis.fetch = jest.fn(
    async (url: RequestInfo | URL, options?: RequestInit) => {
      urls.push(String(url));
      const token = (options?.headers as Record<string, string>)?.Authorization;
      return new Response(
        JSON.stringify(
          token === 'Bearer new-token'
            ? { ok: true }
            : { code: 'UNAUTHORIZED' },
        ),
        { status: token === 'Bearer new-token' ? 200 : 401 },
      );
    },
  ) as typeof fetch;
  configureAuthRefresh({ refresh: () => old.promise, onLogout: null });
  const first = requestWithAuth(
    'GET',
    '/old',
    z.object({ ok: z.boolean() }),
  ).catch(() => null);
  await waitFor(() => expect(urls).toHaveLength(1));
  await clearAuthFlows();
  const refresh = jest.fn(() => next.promise);
  configureAuthRefresh({ refresh, onLogout: null });
  const second = requestWithAuth('GET', '/new', z.object({ ok: z.boolean() }));
  await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
  old.resolve('obsolete-token');
  await first;
  expect(getAccessToken()).not.toBe('obsolete-token');
  const third = requestWithAuth(
    'GET',
    '/new-again',
    z.object({ ok: z.boolean() }),
  );
  await waitFor(() => expect(urls).toHaveLength(3));
  next.resolve('new-token');
  await expect(Promise.all([second, third])).resolves.toEqual([
    { ok: true },
    { ok: true },
  ]);
  expect(refresh).toHaveBeenCalledTimes(1);
  expect(urls.filter((url) => url.endsWith('/old'))).toHaveLength(1);
});
