import { monotonicNow } from '@/lib/server-clock';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/providers/ToastProvider';
import { services, type NextStep } from '@/services';
import { isApiError } from '@/services/http/errors';
import { devReason } from '@/services/http/devReason';
import { useAuthActions } from '@/providers/AuthProvider';
import { authOperation, otpChallenge } from '../store';
import { emailSchema, otpSchema, phoneSchema } from '../schemas';
import { AuthIntentError, type AuthIntent } from '@/lib/auth-intent';

/** A phone number is optional: an older server's `phone` step also goes home. */
export function routeForNextStep(nextStep: NextStep) {
  return nextStep === 'profile' ? '/profile-setup' : '/home';
}

/**
 * E-mailed codes: `signIn` proves an e-mail address, `link` adds a phone number.
 * Async service calls are kept outside the query cache to avoid retaining OTP/PII.
 */
export function usePhoneAuth(
  mode: 'signIn' | 'link' = 'signIn',
  intent?: AuthIntent,
) {
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
  const [conflict, setConflict] = useState<AuthIntentError['reason']>();
  const [invalidAttempt, setInvalidAttempt] = useState(0);
  const [requestRetryAt, setRequestRetryAt] = useState(authOperation.retryAt);
  const [phoneInUse, setPhoneInUse] = useState(false);

  const handleError = (cause: unknown) => {
    if (cause instanceof AuthIntentError) {
      setConflict(cause.reason);
      setError(t(`authFlow.${cause.reason}`));
      return;
    }
    const code = isApiError(cause) ? cause.code : 'UNKNOWN';
    if (code === 'PHONE_IN_USE') {
      setPhoneInUse(true);
      return;
    }
    if (code === 'NETWORK' || code === 'TIMEOUT') {
      toast(
        t(code === 'NETWORK' ? 'errors.network' : 'errors.timeout') +
          devReason(cause),
      );
      return;
    }
    if (code === 'OTP_TOO_MANY' || code === 'RATE_LIMITED') {
      if (isApiError(cause) && cause.retryAfterSeconds !== null) {
        otpChallenge.lock(cause.retryAfterSeconds);
        authOperation.limit(cause.retryAfterSeconds);
        setRequestRetryAt(authOperation.retryAt());
      }
      setError(t('auth.tooMany'));
    } else if (
      code === 'EMAIL_REQUIRED' ||
      code === 'EMAIL_DELIVERY_FAILED' ||
      code === 'PHONE_SIGNIN_UNAVAILABLE' ||
      code === 'IDENTITY_ALREADY_LINKED'
    ) {
      setError(t(`contact.errors.${code}`));
    } else if (code === 'OTP_INVALID') {
      setInvalidAttempt((value) => value + 1);
      setError(t('auth.otpInvalid'));
    } else
      setError(
        t(code === 'OTP_EXPIRED' ? 'auth.otpExpired' : 'errors.generic'),
      );
  };

  const requestCode = async (value: string) => {
    if (gate.current) return false;
    if (authOperation.retryAt() > monotonicNow()) return false;
    const parsed = (mode === 'link' ? phoneSchema : emailSchema).safeParse(
      value,
    );
    if (!parsed.success) {
      setError(t(mode === 'link' ? 'auth.invalidPhone' : 'auth.invalidEmail'));
      return false;
    }
    const target = parsed.data;
    const current = otpChallenge.get();
    const activeIntent =
      intent ?? (current?.target === target ? current.intent : undefined);
    if (
      current?.mode === mode &&
      current.intent === activeIntent &&
      current.target === target &&
      Math.max(current.resendAt, current.lockedUntil) > monotonicNow()
    )
      return false;
    if (!authOperation.acquire()) return false;
    const epoch = authOperation.epoch();
    gate.current = true;
    setBusy(true);
    setError(undefined);
    try {
      const result = await (mode === 'link'
        ? services.auth.requestPhoneLinkOtp({ phone: target })
        : services.auth.requestOtp({
            email: target,
            ...(activeIntent ? { intent: activeIntent } : {}),
          }));
      if (!authOperation.current(epoch)) return false;
      otpChallenge.set(
        target,
        result.retryAfterSeconds,
        mode,
        activeIntent,
        result.delivery,
        result.sentTo,
      );
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
      current.lockedUntil > monotonicNow() ||
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
          phone: current.target,
          code,
        });
        return active.current && authOperation.current(epoch)
          ? updateUser(user)
          : null;
      }
      const result = await services.auth.verifyOtp({
        email: current.target,
        code,
        ...(current.intent ? { intent: current.intent } : {}),
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
    conflict,
    invalidAttempt,
    requestRetryAt,
    phoneInUse,
    dismissPhoneInUse: () => setPhoneInUse(false),
    clearError: () => {
      setError(undefined);
      setConflict(undefined);
    },
    requestCode,
    verifyCode,
  };
}
