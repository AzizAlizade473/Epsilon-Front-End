import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { AuthHeading } from '@/components/ui/AuthHeading';
import { Brand } from '@/components/ui/Brand';
import { BackButton } from '@/components/navigation/BackButton';
import Smartphone from 'lucide-react-native/icons/smartphone';
import { useAuth } from '@/providers/AuthProvider';
import { PhoneField } from '../components/PhoneField';
import { PhoneInUseSheet } from '../components/PhoneInUseSheet';
import { useSecondsUntil } from '@/components/ui/ResendTimer';
import { usePhoneAuth } from '../hooks/usePhoneAuth';
import { formatPhone, phoneSchema } from '../schemas';
import { otpChallenge, useOtpChallenge } from '../store';

export default function PhoneVerifyScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const auth = usePhoneAuth('link');
  const challenge = useOtpChallenge();
  const [phone, setPhone] = useState(
    challenge?.mode === 'link' ? formatPhone(challenge.target) : '',
  );
  const valid = phoneSchema.safeParse(phone);
  const cooldown = useSecondsUntil(
    valid.success &&
      challenge?.mode === 'link' &&
      challenge.target === valid.data
      ? challenge.resendAt
      : 0,
  );
  const rateLimited = useSecondsUntil(auth.requestRetryAt) > 0;
  const submit = async () => {
    if (!valid.success || auth.busy || rateLimited) return;
    if (cooldown > 0 || (await auth.requestCode(phone)))
      router.push('/phone-verify-code');
  };
  return (
    <Screen
      surface="surface"
      leading={<BackButton />}
      trailing={<Brand />}
      footer={
        <Button
          label={t(cooldown > 0 ? 'auth.enterCode' : 'auth.sendCode')}
          loading={auth.busy}
          disabled={!valid.success || rateLimited}
          onPress={() => {
            void submit();
          }}
        />
      }
    >
      <AuthHeading
        icon={Smartphone}
        title={t('navigation.phoneVerify')}
        message={
          user?.email
            ? t('contact.phoneAddHelper', { email: user.email })
            : t('contact.errors.EMAIL_REQUIRED')
        }
      />
      <PhoneField
        value={phone}
        onChange={(value) => {
          setPhone(value);
          auth.clearError();
        }}
        disabled={auth.busy}
        error={auth.error}
        onSubmit={() => {
          void submit();
        }}
      />
      <PhoneInUseSheet
        visible={auth.phoneInUse}
        onEdit={() => {
          auth.dismissPhoneInUse();
          otpChallenge.clear();
          setPhone('');
        }}
      />
    </Screen>
  );
}
