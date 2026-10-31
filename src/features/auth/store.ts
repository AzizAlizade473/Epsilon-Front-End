import { useSyncExternalStore } from 'react';

export type OtpChallenge = {
  phone: string;
  resendAt: number;
  lockedUntil: number;
};

let challenge: OtpChallenge | null = null;
const listeners = new Set<() => void>();
let pending = false;
let requestRetryAt = 0;
export const authOperation = {
  acquire() {
    if (pending) return false;
    pending = true;
    return true;
  },
  release() {
    pending = false;
  },
  retryAt: () => requestRetryAt,
  limit(seconds: number) {
    requestRetryAt = Date.now() + seconds * 1000;
  },
};
function emit() {
  listeners.forEach((listener) => listener());
}

/** Memory only: no phone or code in route params, storage, query keys or logs. */
export const otpChallenge = {
  get: () => challenge,
  set(phone: string, retryAfterSeconds: number) {
    challenge = {
      phone,
      resendAt: Date.now() + retryAfterSeconds * 1000,
      lockedUntil: 0,
    };
    emit();
  },
  lock(seconds: number) {
    if (!challenge) return;
    const until = Date.now() + seconds * 1000;
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
