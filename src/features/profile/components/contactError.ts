import { isApiError, type ApiErrorCode } from '@/services/http/errors';

const known: ApiErrorCode[] = [
  'EMAIL_IN_USE',
  'EMAIL_IS_PRIMARY',
  'LAST_SIGN_IN_METHOD',
  'EMAIL_DELIVERY_FAILED',
  'OTP_INVALID',
  'OTP_EXPIRED',
  'OTP_TOO_MANY',
  'RATE_LIMITED',
  'NETWORK',
  'TIMEOUT',
];

/** The locale key explaining an account-contact failure, or the caller's fallback. */
export function contactErrorKey(cause: unknown, fallback = 'errors.generic') {
  return isApiError(cause) && known.includes(cause.code)
    ? `contact.errors.${cause.code}`
    : fallback;
}
