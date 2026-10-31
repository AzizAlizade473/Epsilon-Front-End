/**
 * Idempotency-Key header helper (NET-3).
 *
 * Generates a unique key per mutation. Callers should cache the key for
 * the lifetime of the request attempt so retries carry the same key.
 *
 * Format: <prefix>-<uuid>
 * The prefix helps with server-side log correlation.
 */

let _keyCounter = 0;

function newUuid(): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const uuid = (globalThis as any).crypto?.randomUUID?.();
  if (typeof uuid === 'string') return uuid;
  // Fallback for test environments without Web Crypto
  _keyCounter += 1;
  return `${Date.now()}-${_keyCounter}`;
}

/**
 * Generates a new idempotency key for a mutation.
 *
 * @param prefix - Short descriptive prefix (e.g. "otp-request", "feedback-submit").
 */
export function generateIdempotencyKey(prefix: string): string {
  return `${prefix}-${newUuid()}`;
}
