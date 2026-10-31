/**
 * 03.c — Single-flight 401 refresh client wrapper (NET-4).
 *
 * When an authenticated request fails with 401 (UNAUTHORIZED):
 * 1. Checks if a refresh handler is registered.
 * 2. If a refresh is already in-flight, shares that promise (single-flight).
 * 3. On successful refresh, retries the failed request once with the new token.
 * 4. If the retry also fails with 401, or if refresh fails, clears session
 *    via onLogout callback and rethrows the ApiError.
 */

import { z } from 'zod';

import {
  request,
  setAccessToken,
  type HttpMethod,
  type RequestOptions,
} from './client';
import { ApiError } from './errors';

export type RefreshFn = () => Promise<string>;
export type LogoutFn = () => void | Promise<void>;

let _refreshFn: RefreshFn | null = null;
let _onLogout: LogoutFn | null = null;
let _inflightRefresh: Promise<string> | null = null;

export function configureAuthRefresh(config: {
  refresh: RefreshFn | null;
  onLogout: LogoutFn | null;
}): void {
  _refreshFn = config.refresh;
  _onLogout = config.onLogout;
  _inflightRefresh = null;
}

export function resetAuthRefresh(): void {
  _refreshFn = null;
  _onLogout = null;
  _inflightRefresh = null;
}

async function triggerSingleFlightRefresh(): Promise<string> {
  if (!_refreshFn) {
    throw new ApiError({
      code: 'UNAUTHORIZED',
      message: 'No refresh token provider configured',
      status: 401,
    });
  }

  if (!_inflightRefresh) {
    _inflightRefresh = _refreshFn()
      .then((newAccessToken) => {
        setAccessToken(newAccessToken);
        return newAccessToken;
      })
      .catch(async (err) => {
        setAccessToken(null);
        if (_onLogout) {
          try {
            await _onLogout();
          } catch {
            // Ignore errors in logout callback
          }
        }
        throw err;
      })
      .finally(() => {
        _inflightRefresh = null;
      });
  }

  return _inflightRefresh;
}

export async function requestWithAuth<T>(
  method: HttpMethod,
  path: string,
  schema: z.ZodType<T>,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  try {
    return await request(method, path, schema, body, options);
  } catch (err) {
    const isUnauthorized =
      err instanceof ApiError && err.code === 'UNAUTHORIZED';

    if (!isUnauthorized || !_refreshFn) {
      throw err;
    }

    // Attempt single-flight refresh
    try {
      await triggerSingleFlightRefresh();
    } catch {
      // Refresh failed; error already triggered onLogout and was thrown
      throw err;
    }

    // Retry once with new token
    try {
      return await request(method, path, schema, body, options);
    } catch (retryErr) {
      if (retryErr instanceof ApiError && retryErr.code === 'UNAUTHORIZED') {
        setAccessToken(null);
        if (_onLogout) {
          try {
            await _onLogout();
          } catch {
            // Ignore error in logout handler
          }
        }
      }
      throw retryErr;
    }
  }
}
