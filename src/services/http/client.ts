/**
 * Epsilon HTTP client — fetch-based, no axios.
 *
 * Contracts (from 03-services spec):
 *  - Base URL from env (EXPO_PUBLIC_API_URL). SEC-9.
 *  - JSON only; Content-Type: application/json on mutations.
 *  - 15 s timeout via AbortController. NET-1.
 *  - Bearer token read from in-memory token store (SEC-2); never from disk here.
 *  - Headers: Accept-Language (current locale), X-Request-Id (per-request UUID).
 *  - Zod schema validation on every response. NET-1.
 *  - GET retries up to 2 times with jitter (NET-2); mutations never retry here.
 *  - 401 triggers single-flight token refresh (NET-4) — wired in client-with-refresh.ts.
 *  - Typed ApiError on all failure paths.
 */

import { z } from 'zod';

import { env } from '@/lib/env';
import { ApiError, type ApiErrorCode, codeFromStatus } from './errors';

// ---------------------------------------------------------------------------
// UUID helper — uses global Web Crypto (available in Node 20+ and Hermes)
// ---------------------------------------------------------------------------

function newRequestId(): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (globalThis as any).crypto?.randomUUID?.() ?? fallbackId();
}

let _idCounter = 0;
function fallbackId(): string {
  // Fallback for environments that don't expose crypto.randomUUID
  _idCounter += 1;
  return `req-${Date.now()}-${_idCounter}`;
}

// ---------------------------------------------------------------------------
// In-memory token store (SEC-2 — never persisted by this module)
// ---------------------------------------------------------------------------

let _accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  _accessToken = token;
}

export function getAccessToken(): string | null {
  return _accessToken;
}

// ---------------------------------------------------------------------------
// Locale accessor — injected so the HTTP client stays decoupled from i18n
// ---------------------------------------------------------------------------

let _getLocale: () => string = () => 'az';

export function setLocaleAccessor(fn: () => string): void {
  _getLocale = fn;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
  /** Idempotency-Key for mutations (NET-3). Required for POST/PUT/PATCH/DELETE. */
  idempotencyKey?: string;
  /** Additional headers to merge. */
  headers?: Record<string, string>;
  /** AbortSignal for external cancellation. Combined with internal 15s timeout. */
  signal?: AbortSignal;
}

// ---------------------------------------------------------------------------
// Server error body schema
// ---------------------------------------------------------------------------

const serverErrorBodySchema = z
  .object({
    code: z.string(),
    message: z.string().optional(),
    retryAfterSeconds: z.number().int().nonnegative().optional(),
  })
  .passthrough();

// ---------------------------------------------------------------------------
// Jitter helper for GET retries (NET-2)
// ---------------------------------------------------------------------------

function jitterMs(attempt: number): number {
  // Exponential: 200ms * 2^attempt ± 50 % random jitter
  const base = 200 * Math.pow(2, attempt);
  return base + Math.random() * base;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Core request function
// ---------------------------------------------------------------------------

const TIMEOUT_MS = 15_000;
const GET_MAX_RETRIES = 2;

/**
 * Makes a typed, validated HTTP request.
 *
 * @param method  HTTP method.
 * @param path    Path relative to EXPO_PUBLIC_API_URL (must start with "/").
 * @param schema  Zod schema to validate the successful response body.
 * @param body    JSON-serialisable body for mutations.
 * @param options Additional request options.
 */
export async function request<T>(
  method: HttpMethod,
  path: string,
  schema: z.ZodType<T>,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  const isGet = method === 'GET';
  const maxAttempts = isGet ? GET_MAX_RETRIES + 1 : 1;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) {
      await sleep(jitterMs(attempt - 1));
    }

    try {
      return await executeRequest(method, path, schema, body, options);
    } catch (err) {
      const isRetryable =
        isGet &&
        attempt < maxAttempts - 1 &&
        err instanceof ApiError &&
        (err.code === 'NETWORK' || err.code === 'TIMEOUT');

      if (!isRetryable) throw err;
      // Loop to retry
    }
  }

  // TypeScript exhaustiveness — unreachable
  throw new ApiError({ code: 'UNKNOWN', message: 'Unreachable', status: 0 });
}

async function executeRequest<T>(
  method: HttpMethod,
  path: string,
  schema: z.ZodType<T>,
  body: unknown,
  options?: RequestOptions,
): Promise<T> {
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), TIMEOUT_MS);

  // Combine external signal with internal timeout by listening on both.
  // AbortSignal.any is not yet guaranteed in all Hermes builds.
  if (options?.signal) {
    options.signal.addEventListener('abort', () =>
      timeoutController.abort(options.signal!.reason),
    );
  }

  const signal = timeoutController.signal;
  const requestId = newRequestId();
  const url = `${env.EXPO_PUBLIC_API_URL}${path}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Accept-Language': _getLocale(),
    'X-Request-Id': requestId,
    ...options?.headers,
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (_accessToken) {
    headers['Authorization'] = `Bearer ${_accessToken}`;
  }

  if (options?.idempotencyKey) {
    headers['Idempotency-Key'] = options.idempotencyKey;
  }

  let response: Response;

  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError({
        code: 'TIMEOUT',
        message: 'Request timed out',
        status: 0,
        requestId,
      });
    }
    throw new ApiError({
      code: 'NETWORK',
      message: err instanceof Error ? err.message : 'Network error',
      status: 0,
      requestId,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  const serverRequestId = response.headers.get('X-Request-Id') ?? requestId;

  // ---------------------------------------------------------------------------
  // Error responses
  // ---------------------------------------------------------------------------

  if (!response.ok) {
    let code: ApiErrorCode = codeFromStatus(response.status);
    let message = `HTTP ${response.status}`;
    const retryHeader = response.headers.get('Retry-After');
    let retryAfterSeconds: number | null =
      retryHeader && /^\d+$/.test(retryHeader) ? Number(retryHeader) : null;

    try {
      const errorJson: unknown = await response.json();
      const parsed = serverErrorBodySchema.safeParse(errorJson);
      if (parsed.success) {
        code = parsed.data.code as ApiErrorCode;
        message = parsed.data.message ?? message;
        retryAfterSeconds = parsed.data.retryAfterSeconds ?? retryAfterSeconds;
      }
    } catch {
      // Non-JSON error body; keep defaults
    }

    throw new ApiError({
      code,
      message,
      status: response.status,
      requestId: serverRequestId,
      retryAfterSeconds,
    });
  }

  // ---------------------------------------------------------------------------
  // Success — validate with Zod (NET-1)
  // ---------------------------------------------------------------------------

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new ApiError({
      code: 'BAD_RESPONSE',
      message: 'Response body is not valid JSON',
      status: response.status,
      requestId: serverRequestId,
    });
  }

  const result = schema.safeParse(json);
  if (!result.success) {
    throw new ApiError({
      code: 'BAD_RESPONSE',
      message: `Response schema mismatch: ${result.error.issues[0]?.message ?? 'unknown'}`,
      status: response.status,
      requestId: serverRequestId,
    });
  }

  return result.data;
}
