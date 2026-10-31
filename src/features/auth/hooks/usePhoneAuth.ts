import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/providers/ToastProvider';
import { services, type NextStep } from '@/services';
import { isApiError } from '@/services/http/errors';
import { useAuthActions } from '@/providers/AuthProvider';
import { authOperation, otpChallenge } from '../store';
import { otpSchema, phoneSchema } from '../schemas';

export function routeForNextStep(nextStep: NextStep) {
  return { profile: '/profile-setup', phone: '/phone-verify', home: '/home' }[
    nextStep
  ] as '/profile-setup' | '/phone-verify' | '/home';
}

/** Async service calls are kept outside the query cache to avoid retaining OTP/PII. */
export function usePhoneAuth(mode: 'signIn' | 'link' = 'signIn') {
  const { t } = useTranslation();
  const toast = useToast();
  const { completeSignIn, updateUser } = useAuthActions();
  const gate = useRef(false);
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [invalidAttempt, setInvalidAttempt] = useState(0);
  const [requestRetryAt, setRequestRetryAt] = useState(authOperation.retryAt);
  const [phoneInUse, setPhoneInUse] = useState(false);

  const handleError = (cause: unknown) => {
    const code = isApiError(cause) ? cause.code : 'UNKNOWN';
    if (code === 'PHONE_IN_USE') {
      setPhoneInUse(true);
      return;
    }
    if (code === 'NETWORK' || code === 'TIMEOUT') {
      toast(t(code === 'NETWORK' ? 'errors.network' : 'errors.timeout'));
      return;
    }
    if (code === 'OTP_TOO_MANY' || code === 'RATE_LIMITED') {
      if (isApiError(cause) && cause.retryAfterSeconds !== null) {
        otpChallenge.lock(cause.retryAfterSeconds);
        authOperation.limit(cause.retryAfterSeconds);
        setRequestRetryAt(authOperation.retryAt());
      }
      setError(t('auth.tooMany'));
    } else if (code === 'OTP_INVALID') {
      setInvalidAttempt((value) => value + 1);
      setError(t('auth.otpInvalid'));
    } else
      setError(
        t(code === 'OTP_EXPIRED' ? 'auth.otpExpired' : 'errors.generic'),
      );
  };

  const requestCode = async (phone: string) => {
    if (gate.current) return false;
    if (authOperation.retryAt() > Date.now()) return false;
    const parsed = phoneSchema.safeParse(phone);
    if (!parsed.success) {
      setError(t('auth.invalidPhone'));
      return false;
    }
    const current = otpChallenge.get();
    if (
      current?.mode === mode &&
      current.phone === parsed.data &&
      Math.max(current.resendAt, current.lockedUntil) > Date.now()
    )
      return false;
    if (!authOperation.acquire()) return false;
    const epoch = authOperation.epoch();
    gate.current = true;
    setBusy(true);
    setError(undefined);
    try {
      const result = await (mode === 'link'
        ? services.auth.requestPhoneLinkOtp({ phone: parsed.data })
        : services.auth.requestOtp({ phone: parsed.data }));
      if (!authOperation.current(epoch)) return false;
      otpChallenge.set(parsed.data, result.retryAfterSeconds, mode);
      return active.current;
    } catch (cause) {
      if (active.current && authOperation.current(epoch)) handleError(cause);
      return false;
    } finally {
      gate.current = false;
      authOperation.release(epoch);
      if (active.current) setBusy(false);
    }
  };

  const verifyCode = async (code: string) => {
    const current = otpChallenge.get();
    if (
      gate.current ||
      !current ||
      current.mode !== mode ||
      current.lockedUntil > Date.now() ||
      !otpSchema.safeParse(code).success
    )
      return null;
    if (!authOperation.acquire()) return null;
    const epoch = authOperation.epoch();
    gate.current = true;
    setBusy(true);
    setError(undefined);
    try {
      if (mode === 'link') {
        const user = await services.auth.verifyPhoneLink({
          phone: current.phone,
          code,
        });
        return active.current && authOperation.current(epoch)
          ? updateUser(user)
          : null;
      }
      const result = await services.auth.verifyOtp({
        phone: current.phone,
        code,
      });
      if (!active.current || !authOperation.current(epoch)) return null;
      await completeSignIn(result);
      return active.current && authOperation.current(epoch)
        ? routeForNextStep(result.nextStep)
        : null;
    } catch (cause) {
      if (active.current && authOperation.current(epoch)) handleError(cause);
      return null;
    } finally {
      gate.current = false;
      authOperation.release(epoch);
      if (active.current) setBusy(false);
    }
  };

  return {
    busy,
    error,
    invalidAttempt,
    requestRetryAt,
    phoneInUse,
    dismissPhoneInUse: () => setPhoneInUse(false),
    clearError: () => setError(undefined),
    requestCode,
    verifyCode,
  };
}
