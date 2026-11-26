import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSecondsUntil } from '@/components/ui/ResendTimer';
import { emailSchema } from '../schemas';
import { entryDraft, useOtpChallenge } from '../store';
import { usePhoneAuth } from './usePhoneAuth';
import type { AuthIntent } from '@/lib/auth-intent';

/** Reuses the canonical OTP operation; entry intent never creates an account. */
export function useEmailEntry(intent: AuthIntent) {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState(entryDraft.get);
  const [touched, setTouched] = useState(false);
  useEffect(() => entryDraft.clear(), []);
  const auth = usePhoneAuth('signIn', intent);
  const challenge = useOtpChallenge();
  const valid = emailSchema.safeParse(email);
  const sameEmail =
    valid.success &&
    valid.data === challenge?.target &&
    challenge.intent === intent;
  const cooldown = useSecondsUntil(
    sameEmail
      ? Math.max(challenge?.resendAt ?? 0, challenge?.lockedUntil ?? 0)
      : 0,
  );
  const rateLimited = useSecondsUntil(auth.requestRetryAt) > 0;
  const submit = async () => {
    if (!valid.success || auth.busy || rateLimited) return;
    if (cooldown > 0) {
      router.push('/otp');
      return;
    }
    if (await auth.requestCode(email)) router.push('/otp');
    // Kept only after a refusal, so "Create account" / "Log in" opens prefilled.
    else entryDraft.set(email);
  };
  return {
    email,
    busy: auth.busy,
    conflict: auth.conflict,
    disabled: !valid.success || rateLimited,
    hasCode: cooldown > 0,
    submit,
    onChange: (value: string) => {
      setEmail(value);
      setTouched(true);
      auth.clearError();
    },
    error:
      auth.error ??
      (touched && email.trim().length > 0 && !valid.success
        ? t('auth.invalidEmail')
        : undefined),
  };
}
