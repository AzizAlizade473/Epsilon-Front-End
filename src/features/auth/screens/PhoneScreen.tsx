import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BackButton } from '@/components/navigation/BackButton';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { PhoneField } from '../components/PhoneField';
import { useSecondsUntil } from '../components/ResendTimer';
import { usePhoneAuth } from '../hooks/usePhoneAuth';
import { phoneSchema } from '../schemas';
import { useOtpChallenge } from '../store';

export default function PhoneScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [touched, setTouched] = useState(false);
  const auth = usePhoneAuth();
  const challenge = useOtpChallenge();
  const valid = phoneSchema.safeParse(phone);
  const samePhone = valid.success && valid.data === challenge?.phone;
  const cooldown = useSecondsUntil(
    samePhone
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
    if (await auth.requestCode(phone)) router.push('/otp');
  };
  return (
    <Screen
      title={t('navigation.phone')}
      leading={<BackButton />}
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
      <Text>{t('auth.phoneHelper')}</Text>
      <PhoneField
        value={phone}
        disabled={auth.busy}
        onSubmit={() => {
          void submit();
        }}
        onChange={(value) => {
          setPhone(value);
          setTouched(true);
          auth.clearError();
        }}
        error={
          auth.error ??
          (touched && phone.length > 0 && !valid.success
            ? t('auth.invalidPhone')
            : undefined)
        }
      />
    </Screen>
  );
}
