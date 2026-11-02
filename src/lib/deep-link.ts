import { z } from 'zod';

export const deepLinkScheme = 'epsilon';

/** Identifier schema (SEC-6): alphanumeric/dash/underscore only, no path traversal or query injection. */
export const safeIdSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Identifier must be alphanumeric, hyphen, or underscore',
  );

export const receiptParamsSchema = z.object({
  receiptId: safeIdSchema,
});

export const rateParamsSchema = z.object({
  receiptItemId: safeIdSchema,
});

export const transactionParamsSchema = z.object({
  id: safeIdSchema,
});

export type DeepLinkResult =
  | {
      valid: true;
      path:
        | '/home'
        | '/restaurants'
        | '/cashback'
        | '/profile'
        | '/scan'
        | '/welcome'
        | '/phone'
        | '/login'
        | '/register'
        | `/receipt/${string}`
        | `/rate/${string}`
        | `/cashback/transaction/${string}`;
    }
  | {
      valid: false;
      path: '/+not-found';
      reason:
        'invalid_scheme' | 'invalid_url' | 'unknown_route' | 'invalid_params';
    };

const staticRoutes = new Set([
  'home',
  'restaurants',
  'cashback',
  'profile',
  'scan',
  'welcome',
  'phone',
  'login',
  'register',
]);

/**
 * Validates and resolves incoming deep links according to SEC-6.
 * Enforces scheme epsilon://, validates route parameters with Zod,
 * and routes unknown or invalid links to /+not-found.
 * Links strictly navigate and never execute actions.
 */
export function resolveDeepLink(rawUrl: string): DeepLinkResult {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { valid: false, path: '/+not-found', reason: 'invalid_url' };
  }

  if (url.protocol !== `${deepLinkScheme}:`) {
    return { valid: false, path: '/+not-found', reason: 'invalid_scheme' };
  }

  const rawPath = (url.host ? `/${url.host}` : '') + url.pathname;
  const segments = rawPath.split('/').filter(Boolean);

  if (segments.length === 1 && segments[0] && staticRoutes.has(segments[0])) {
    return {
      valid: true,
      path: `/${segments[0]}` as DeepLinkResult extends {
        valid: true;
        path: infer P;
      }
        ? P
        : never,
    };
  }

  if (segments.length === 2 && segments[0] === 'receipt' && segments[1]) {
    const parse = receiptParamsSchema.safeParse({ receiptId: segments[1] });
    if (!parse.success) {
      return { valid: false, path: '/+not-found', reason: 'invalid_params' };
    }
    return { valid: true, path: `/receipt/${parse.data.receiptId}` };
  }

  if (segments.length === 2 && segments[0] === 'rate' && segments[1]) {
    const parse = rateParamsSchema.safeParse({ receiptItemId: segments[1] });
    if (!parse.success) {
      return { valid: false, path: '/+not-found', reason: 'invalid_params' };
    }
    return { valid: true, path: `/rate/${parse.data.receiptItemId}` };
  }

  if (
    segments.length === 3 &&
    segments[0] === 'cashback' &&
    segments[1] === 'transaction' &&
    segments[2]
  ) {
    const parse = transactionParamsSchema.safeParse({ id: segments[2] });
    if (!parse.success) {
      return { valid: false, path: '/+not-found', reason: 'invalid_params' };
    }
    return { valid: true, path: `/cashback/transaction/${parse.data.id}` };
  }

  return { valid: false, path: '/+not-found', reason: 'unknown_route' };
}
