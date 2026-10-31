import { describe, expect, it } from '@jest/globals';

import {
  receiptParamsSchema,
  resolveDeepLink,
  safeIdSchema,
} from '@/lib/deep-link';

describe('deep link param schemas (SEC-6)', () => {
  it('accepts valid alphanumeric, hyphenated, and underscored IDs', () => {
    expect(safeIdSchema.safeParse('rcpt-123_456').success).toBe(true);
    expect(
      receiptParamsSchema.safeParse({ receiptId: 'abc-789' }).success,
    ).toBe(true);
  });

  it('rejects path traversal, spaces, injection, and empty values', () => {
    expect(safeIdSchema.safeParse('').success).toBe(false);
    expect(safeIdSchema.safeParse('../secret').success).toBe(false);
    expect(safeIdSchema.safeParse('id with spaces').success).toBe(false);
    expect(safeIdSchema.safeParse('id;DROP TABLE').success).toBe(false);
    expect(safeIdSchema.safeParse('id?foo=bar').success).toBe(false);
  });
});

describe('resolveDeepLink (SEC-6)', () => {
  it('resolves valid static tabs and features on epsilon:// scheme', () => {
    expect(resolveDeepLink('epsilon://home')).toEqual({
      valid: true,
      path: '/home',
    });
    expect(resolveDeepLink('epsilon://restaurants')).toEqual({
      valid: true,
      path: '/restaurants',
    });
    expect(resolveDeepLink('epsilon://cashback')).toEqual({
      valid: true,
      path: '/cashback',
    });
    expect(resolveDeepLink('epsilon://profile')).toEqual({
      valid: true,
      path: '/profile',
    });
    expect(resolveDeepLink('epsilon://scan')).toEqual({
      valid: true,
      path: '/scan',
    });
  });

  it('resolves valid parameterized routes with validated IDs', () => {
    expect(resolveDeepLink('epsilon://receipt/rcpt-001')).toEqual({
      valid: true,
      path: '/receipt/rcpt-001',
    });
    expect(resolveDeepLink('epsilon://rate/item_99')).toEqual({
      valid: true,
      path: '/rate/item_99',
    });
    expect(
      resolveDeepLink('epsilon://cashback/transaction/tx-abc-123'),
    ).toEqual({
      valid: true,
      path: '/cashback/transaction/tx-abc-123',
    });
  });

  it('rejects foreign schemes and redirects to /+not-found', () => {
    expect(resolveDeepLink('https://epsilonup.app/receipt/123')).toEqual({
      valid: false,
      path: '/+not-found',
      reason: 'invalid_scheme',
    });
    expect(resolveDeepLink('myapp://home')).toEqual({
      valid: false,
      path: '/+not-found',
      reason: 'invalid_scheme',
    });
  });

  it('rejects malformed IDs in parameterized routes', () => {
    expect(resolveDeepLink('epsilon://receipt/invalid!id')).toEqual({
      valid: false,
      path: '/+not-found',
      reason: 'invalid_params',
    });
    expect(resolveDeepLink('epsilon://rate/item;injection')).toEqual({
      valid: false,
      path: '/+not-found',
      reason: 'invalid_params',
    });
  });

  it('rejects unknown routes', () => {
    expect(resolveDeepLink('epsilon://unknown-path')).toEqual({
      valid: false,
      path: '/+not-found',
      reason: 'unknown_route',
    });
    expect(resolveDeepLink('epsilon://receipt/123/delete')).toEqual({
      valid: false,
      path: '/+not-found',
      reason: 'unknown_route',
    });
  });

  it('rejects invalid or unparseable URLs', () => {
    expect(resolveDeepLink('not-a-valid-url')).toEqual({
      valid: false,
      path: '/+not-found',
      reason: 'invalid_url',
    });
  });
});
