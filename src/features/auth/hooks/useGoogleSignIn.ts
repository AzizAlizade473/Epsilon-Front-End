import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { authOperation } from '@/lib/auth-lifecycle';
import { GoogleFlowError, googleDriver } from '@/lib/google-signin';
import { useAuthActions } from '@/providers/AuthProvider';
import { services } from '@/services';
import { isApiError } from '@/services/http/errors';
import { routeForNextStep } from './usePhoneAuth';

export function useGoogleSignIn() {
  const { t } = useTranslation();
  const { completeSignIn } = useAuthActions();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  const signIn = async () => {
    if (!authOperation.acquire()) return null;
    const epoch = authOperation.epoch();
    setBusy(true);
    setError(undefined);
    try {
      const result = await googleDriver.exchange((idToken) => {
        if (!active.current || !authOperation.current(epoch))
          throw new Error('Obsolete authentication');
        return services.auth.signInWithGoogle({ idToken });
      });
      if (!result || !active.current || !authOperation.current(epoch))
        return null;
      await completeSignIn(result);
      return active.current && authOperation.current(epoch)
        ? routeForNextStep(result.nextStep)
        : null;
    } catch (cause) {
      if (active.current && authOperation.current(epoch)) {
        const key =
          cause instanceof GoogleFlowError
            ? `onboarding.${cause.key}`
            : isApiError(cause) && cause.code === 'SOCIAL_EMAIL_UNVERIFIED'
              ? 'onboarding.googleUnverified'
              : isApiError(cause) &&
                  (cause.code === 'NETWORK' || cause.code === 'TIMEOUT')
                ? 'onboarding.googleNetwork'
                : 'onboarding.googleFailed';
        setError(t(key));
      }
      return null;
    } finally {
      authOperation.release(epoch);
      if (active.current) setBusy(false);
    }
  };
  return { busy, error, signIn };
}
