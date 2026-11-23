import { env } from '@/lib/env';
import { isApiError } from './errors';

/** Internal development builds only: " (platform reason)" after a network error, else "". */
export function devReason(cause: unknown): string {
  return env.EXPO_PUBLIC_APP_ENV === 'development' &&
    isApiError(cause) &&
    (cause.code === 'NETWORK' || cause.code === 'TIMEOUT')
    ? ` (${cause.message})`
    : '';
}
