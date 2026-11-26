import { monotonicNow } from '@/lib/server-clock';
import { useSyncExternalStore } from 'react';
import { authOperation, registerAuthCleanup } from '@/lib/auth-lifecycle';
import type { AuthIntent } from '@/lib/auth-intent';
export { authOperation };

export type OtpChallenge = {
  /** The e-mail address being signed in, or the phone number being added. */
  target: string;
  resendAt: number;
  lockedUntil: number;
  mode: 'signIn' | 'link';
  intent?: AuthIntent;
  delivery: 'sms' | 'email';
  sentTo?: string;
};

let challenge: OtpChallenge | null = null;
const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((listener) => listener());
}

/** Memory only: no e-mail, phone or code in route params, storage, query keys or logs. */
export const otpChallenge = {
  get: () => challenge,
  set(
    target: string,
    retryAfterSeconds: number,
    mode: 'signIn' | 'link' = 'signIn',
    intent?: AuthIntent,
    delivery: 'sms' | 'email' = 'sms',
    sentTo?: string,
  ) {
    challenge = {
      target,
      mode,
      delivery,
      ...(sentTo ? { sentTo } : {}),
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

/** The typed address, carried between Log in and Sign up. Memory only. */
let draft = '';
export const entryDraft = {
  get: () => draft,
  set(email: string) {
    draft = email;
  },
  clear() {
    draft = '';
  },
};
registerAuthCleanup(() => entryDraft.clear());

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
