/** Server reason code of a failed scan, as the three outcomes a customer can act on. */
const reasons = {
  RECEIPT_SOURCE_UNAVAILABLE: 'temporary',
  RECEIPT_READER_UNAVAILABLE: 'temporary',
  RECEIPT_READER_QUOTA: 'temporary',
  RECEIPT_READER_BUSY: 'temporary',
  RATE_LIMITED: 'temporary',
  NETWORK: 'temporary',
  TIMEOUT: 'temporary',
  INTERNAL: 'temporary',
  RECEIPT_UNSUPPORTED: 'unsupported',
  RECEIPT_NOT_FOUND: 'invalid',
  RECEIPT_ALREADY_CLAIMED: 'invalid',
  RECEIPT_EXPIRED: 'invalid',
  RECEIPT_VERIFICATION_FAILED: 'invalid',
  RECEIPT_IMAGE_INCOMPLETE: 'invalid',
  RECEIPT_IMAGE_MISMATCH: 'invalid',
  VALIDATION_FAILED: 'invalid',
} as const;

export function scanReason(code: string | null) {
  // A code this version does not know is reported as a passing server problem.
  const key =
    code && Object.hasOwn(reasons, code)
      ? (code as keyof typeof reasons)
      : 'INTERNAL';
  return { key, kind: reasons[key] };
}
