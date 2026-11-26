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
  delivery: 'sms' | 'email';
  sentTo?: string;
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
    delivery: 'sms' | 'email' = 'sms',
    sentTo?: string,
  ) {
    challenge = {
      phone,
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

/** Typed entry values carried between Log in and Sign up. Memory only. */
let draft = { phone: '', email: '' };
export const entryDraft = {
  get: () => draft,
  set(next: { phone: string; email: string }) {
    draft = next;
  },
  clear() {
    draft = { phone: '', email: '' };
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
