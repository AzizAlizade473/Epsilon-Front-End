import { monotonicNow } from '@/lib/server-clock';
import { useSyncExternalStore } from 'react';
import { authOperation, registerAuthCleanup } from '@/lib/auth-lifecycle';
import type { AuthIntent } from '@/lib/auth-intent';
export { authOperation };

export type OtpChallenge = {
  phone: string;
  resendAt: number;
  lockedUntil: number;
  mode: 'signIn' | 'link';
  intent?: AuthIntent;
};

let challenge: OtpChallenge | null = null;
const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((listener) => listener());
}

/** Memory only: no phone or code in route params, storage, query keys or logs. */
export const otpChallenge = {
  get: () => challenge,
  set(
    phone: string,
    retryAfterSeconds: number,
    mode: 'signIn' | 'link' = 'signIn',
    intent?: AuthIntent,
  ) {
    challenge = {
      phone,
      mode,
      ...(intent ? { intent } : {}),
      resendAt: monotonicNow() + retryAfterSeconds * 1000,
      lockedUntil: 0,
    };
    emit();
  },
  lock(seconds: number) {
    if (!challenge) return;
    const until = monotonicNow() + seconds * 1000;
    challenge = {
      ...challenge,
      lockedUntil: until,
      resendAt: Math.max(challenge.resendAt, until),
    };
    emit();
  },
  clear() {
    challenge = null;
    emit();
  },
};
registerAuthCleanup(() => otpChallenge.clear());

export function useOtpChallenge() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    otpChallenge.get,
    otpChallenge.get,
  );
}
