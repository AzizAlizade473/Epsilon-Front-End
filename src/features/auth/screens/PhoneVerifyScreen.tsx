import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { BackHandler, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { spacing } from '@/design';
import { useAuth, useAuthActions } from '@/providers/AuthProvider';
import { PhoneField } from '../components/PhoneField';
import { PhoneInUseSheet } from '../components/PhoneInUseSheet';
import { OnboardingLogout } from '../components/OnboardingLogout';
import { useSecondsUntil } from '../components/ResendTimer';
import { usePhoneAuth } from '../hooks/usePhoneAuth';
import { useOnboardingConfig } from '../hooks/useOnboardingConfig';
import { formatPhone, phoneSchema } from '../schemas';
import { otpChallenge, useOtpChallenge } from '../store';

export default function PhoneVerifyScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const state = useAuth();
  const { skipPhone } = useAuthActions();
  const config = useOnboardingConfig();
  const auth = usePhoneAuth('link');
  const challenge = useOtpChallenge();
  const [phone, setPhone] = useState(
    challenge?.mode === 'link' ? formatPhone(challenge.phone) : '',
  );
  const valid = phoneSchema.safeParse(phone);
  const cooldown = useSecondsUntil(
    valid.success &&
      challenge?.mode === 'link' &&
      challenge.phone === valid.data
      ? challenge.resendAt
      : 0,
  );
  const rateLimited = useSecondsUntil(auth.requestRetryAt) > 0;
  const mandatory =
    config.data?.requirePhoneVerification ?? state.requirePhoneVerification;
  useFocusEffect(
    useCallback(() => {
      const listener = BackHandler.addEventListener(
        'hardwareBackPress',
        () => true,
      );
      return () => listener.remove();
    }, []),
  );
  const submit = async () => {
    if (!valid.success || auth.busy || !config.data || rateLimited) return;
    if (cooldown > 0 || (await auth.requestCode(phone)))
      router.push('/phone-verify-code');
  };
  return (
    <Screen
      title={t('navigation.phoneVerify')}
      footer={
        <View style={{ gap: spacing[12] }}>
          <Button
            label={t(cooldown > 0 ? 'auth.enterCode' : 'auth.sendCode')}
            loading={auth.busy}
            disabled={!valid.success || !config.data || rateLimited}
            onPress={() => {
              void submit();
            }}
          />
          {!mandatory && config.data && (
            <Button
              variant="ghost"
              label={t('onboarding.notNow')}
              disabled={auth.busy}
              onPress={() => {
                skipPhone();
                router.replace('/home');
              }}
            />
          )}
          <OnboardingLogout />
        </View>
      }
    >
      <Text>{t('onboarding.verifyPhoneHelper')}</Text>
      {config.isError && (
        <>
          <Text accessibilityRole="alert">{t('errors.generic')}</Text>
          <Button
            variant="ghost"
            label={t('common.retry')}
            onPress={() => {
              void config.refetch();
            }}
          />
        </>
      )}
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
