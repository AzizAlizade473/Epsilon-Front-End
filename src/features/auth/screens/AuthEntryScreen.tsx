import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { BackButton } from '@/components/navigation/BackButton';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { env } from '@/lib/env';
import { colors, spacing } from '@/design';
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
  const phone = usePhoneEntry(intent);
  const google = useGoogleSignIn(intent);
  const busy = phone.busy || google.busy;
  const submit = () => {
    if (!busy) void phone.submit();
  };
  return (
    <Screen
      surface="surface"
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
      <View style={styles.heading}>
        <Text variant="title1" accessibilityRole="header" style={styles.title}>
          {t(`authEntry.${intent}`)}
        </Text>
        <Text style={styles.helper}>
          {t(
            intent === 'login'
              ? 'authEntry.loginHelper'
              : 'authEntry.registerHelper',
          )}
        </Text>
      </View>
      <View style={styles.form}>
        <PhoneField
          autoFocus={false}
          value={phone.phone}
          onChange={phone.onChange}
          disabled={busy}
          error={phone.error}
          onSubmit={submit}
        />
        <Button
          shape="rounded"
          label={t(phone.hasCode ? 'auth.enterCode' : 'common.continue')}
          loading={phone.busy}
          disabled={phone.disabled || google.busy}
          onPress={submit}
        />
      </View>
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

const styles = StyleSheet.create({
  heading: { gap: spacing[16], paddingVertical: spacing[32] },
  title: { color: colors.brand.primary, textAlign: 'center' },
  helper: { textAlign: 'center' },
  form: { gap: spacing[24], paddingVertical: spacing[16] },
});
