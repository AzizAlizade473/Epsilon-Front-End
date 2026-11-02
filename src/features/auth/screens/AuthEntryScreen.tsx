import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Keyboard } from 'react-native';
import { BackButton } from '@/components/navigation/BackButton';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Text } from '@/components/ui/Text';
import { env } from '@/lib/env';
import {
  AuthEntrySwitch,
  GoogleEntry,
  type AuthIntent,
} from '../components/AuthEntryActions';
import { LegalLinks } from '../components/LegalLinks';
import { PhoneField } from '../components/PhoneField';
import { useGoogleSignIn } from '../hooks/useGoogleSignIn';
import { usePhoneEntry } from '../hooks/usePhoneEntry';

export default function AuthEntryScreen({ intent }: { intent: AuthIntent }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [method, setMethod] = useState<'phone' | 'email'>('phone');
  const phone = usePhoneEntry();
  const google = useGoogleSignIn();
  const busy = phone.busy || google.busy;
  const submit = () => {
    if (!busy && method === 'phone') void phone.submit();
  };
  return (
    <Screen
      surface="surface"
      title={t(`authEntry.${intent}`)}
      leading={
        <BackButton
          onPress={() => {
            if (!busy) {
              if (router.canGoBack()) router.back();
              else router.replace('/welcome');
            }
          }}
        />
      }
      footer={<AuthEntrySwitch intent={intent} disabled={busy} />}
    >
      <Text>
        {t(
          intent === 'login'
            ? 'authEntry.loginHelper'
            : 'authEntry.registerHelper',
        )}
      </Text>
      <SegmentedControl
        label={t('authEntry.method')}
        options={[
          { value: 'phone', label: t('authEntry.phone') },
          { value: 'email', label: t('authEntry.email') },
        ]}
        value={method}
        disabled={busy}
        onValueChange={(value) => {
          Keyboard.dismiss();
          setMethod(value);
        }}
      />
      {method === 'phone' ? (
        <>
          <PhoneField
            value={phone.phone}
            onChange={phone.onChange}
            disabled={busy}
            error={phone.error}
            onSubmit={submit}
          />
          <Button
            label={t(phone.hasCode ? 'auth.enterCode' : 'common.continue')}
            loading={phone.busy}
            disabled={phone.disabled || google.busy}
            onPress={submit}
          />
        </>
      ) : (
        <Text accessibilityRole="alert" accessibilityLiveRegion="polite">
          {t('authEntry.emailUnavailable')}
        </Text>
      )}
      <GoogleEntry
        busy={busy}
        loading={google.busy}
        error={google.error}
        onPress={() => {
          if (!busy && env.ENABLE_GOOGLE_SIGNIN)
            void google.signIn().then((route) => {
              if (route) router.replace(route);
            });
        }}
      />
      {intent === 'register' && <LegalLinks />}
    </Screen>
  );
}
