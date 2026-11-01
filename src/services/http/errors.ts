/**
 * Typed API error codes used across the client and service layer.
 *
 * Client-side codes (NETWORK, TIMEOUT, BAD_RESPONSE, UNKNOWN) are generated
 * locally; all other codes come from the server.
 */
export const serverErrorCodes = [
  'UNAUTHORIZED',
  'SOCIAL_TOKEN_INVALID',
  'SOCIAL_EMAIL_UNVERIFIED',
  'OTP_INVALID',
  'OTP_EXPIRED',
  'OTP_TOO_MANY',
  'PHONE_IN_USE',
  'IDENTITY_ALREADY_LINKED',
  'RECEIPT_UNSUPPORTED',
  'RECEIPT_NOT_FOUND',
  'RECEIPT_ALREADY_CLAIMED',
  'RECEIPT_EXPIRED',
  'FEEDBACK_ALREADY_SUBMITTED',
  'AGE_RESTRICTED',
  'VALIDATION_FAILED',
  'RATE_LIMITED',
] as const;
export type ApiErrorCode =
  | (typeof serverErrorCodes)[number]
  | 'BAD_RESPONSE'
  | 'NETWORK'
  | 'TIMEOUT'
  | 'UNKNOWN';
/**
 * Structured API error thrown by the HTTP client.
 *
 * - `code` is always one of the typed ApiErrorCode values.
 * - `requestId` echoes the server's X-Request-Id header (for support tracing).
 * - `status` is the HTTP status code; 0 for client-side errors (NETWORK/TIMEOUT).
 */
export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly requestId: string | null;
  readonly retryAfterSeconds: number | null;

  constructor({
    code,
    message,
    status,
    requestId,
    retryAfterSeconds,
  }: {
    code: ApiErrorCode;
    message: string;
    status: number;
    requestId?: string | null;
    retryAfterSeconds?: number | null;
  }) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.requestId = requestId ?? null;
    this.retryAfterSeconds = retryAfterSeconds ?? null;
    // Maintains proper stack trace in V8 environments.
    const errCtor = Error as unknown as {
      captureStackTrace?: (target: object, constructorOpt?: Function) => void;
    };
    if (typeof errCtor.captureStackTrace === 'function') {
      errCtor.captureStackTrace(this, ApiError);
    }
  }

  /** Returns true if the error is safe to show the user directly. */
  isUserFacing(): boolean {
    const USER_FACING: ApiErrorCode[] = [
      'OTP_INVALID',
      'OTP_EXPIRED',
      'OTP_TOO_MANY',
      'PHONE_IN_USE',
      'IDENTITY_ALREADY_LINKED',
      'RECEIPT_UNSUPPORTED',
      'RECEIPT_NOT_FOUND',
      'RECEIPT_ALREADY_CLAIMED',
      'RECEIPT_EXPIRED',
      'FEEDBACK_ALREADY_SUBMITTED',
      'AGE_RESTRICTED',
      'SOCIAL_TOKEN_INVALID',
      'SOCIAL_EMAIL_UNVERIFIED',
      'RATE_LIMITED',
      'VALIDATION_FAILED',
    ];
    return USER_FACING.includes(this.code);
  }
}

/** Narrows an unknown thrown value to ApiError. */
export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}

/** Maps HTTP status codes to ApiErrorCode for error responses without a body code. */
export function codeFromStatus(status: number): ApiErrorCode {
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 429) return 'RATE_LIMITED';
  if (status === 422) return 'VALIDATION_FAILED';
  return 'UNKNOWN';
}
