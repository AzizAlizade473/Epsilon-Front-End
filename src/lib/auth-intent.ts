export type AuthIntent = 'login' | 'register';
export class AuthIntentError extends Error {
  constructor(
    readonly reason: 'unavailable' | 'notFound' | 'exists' | 'conflict',
  ) {
    super('Authentication intent could not be completed');
  }
}
/** Never send an invented intent field to a backend with combined auth only. */
export function requireAuthIntentSupport(
  intent?: AuthIntent,
  supported = false,
) {
  if (intent && !supported) throw new AuthIntentError('unavailable');
}
