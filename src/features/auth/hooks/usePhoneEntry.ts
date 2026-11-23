import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSecondsUntil } from '../components/ResendTimer';
import { emailSchema, phoneSchema } from '../schemas';
import { useOtpChallenge } from '../store';
import { usePhoneAuth } from './usePhoneAuth';
import type { AuthIntent } from '@/lib/auth-intent';

/** Reuses the canonical OTP operation; entry intent never creates an account. */
export function usePhoneEntry(intent?: AuthIntent) {
  const { t } = useTranslation();
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [touched, setTouched] = useState(false);
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const emailValid = emailSchema.safeParse(email);
  const auth = usePhoneAuth('signIn', intent);
  const challenge = useOtpChallenge();
  const valid = phoneSchema.safeParse(phone);
  const samePhone =
    valid.success &&
    valid.data === challenge?.phone &&
    challenge.intent === intent;
  const cooldown = useSecondsUntil(
    samePhone
      ? Math.max(challenge?.resendAt ?? 0, challenge?.lockedUntil ?? 0)
      : 0,
  );
  const rateLimited = useSecondsUntil(auth.requestRetryAt) > 0;
  const submit = async () => {
    if (!valid.success || !emailValid.success || auth.busy || rateLimited)
      return;
    if (cooldown > 0) {
      router.push('/otp');
      return;
    }
    if (await auth.requestCode(phone, emailValid.data)) router.push('/otp');
  };
  return {
    phone,
    busy: auth.busy,
    disabled: !valid.success || !emailValid.success || rateLimited,
    email,
    onEmailChange: (value: string) => {
      setEmail(value);
      setEmailTouched(true);
      auth.clearError();
    },
    emailError:
      emailTouched && email.trim().length > 0 && !emailValid.success
        ? t('auth.invalidEmail')
        : undefined,
    hasCode: cooldown > 0,
    submit,
    onChange: (value: string) => {
      setPhone(value);
      setTouched(true);
      auth.clearError();
    },
    error:
      auth.error ??
      (touched && phone.length > 0 && !valid.success
        ? t('auth.invalidPhone')
        : undefined),
  };
}
