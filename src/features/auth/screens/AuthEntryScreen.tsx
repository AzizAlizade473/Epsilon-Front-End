import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { BackButton } from '@/components/navigation/BackButton';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { AuthHeading } from '@/components/ui/AuthHeading';
import { Brand } from '@/components/ui/Brand';
import Smartphone from 'lucide-react-native/icons/smartphone';
import { env } from '@/lib/env';
import { spacing } from '@/design';
import {
  AuthEntrySwitch,
  GoogleEntry,
  type AuthIntent,
} from '../components/AuthEntryActions';
import { LegalLinks } from '../components/LegalLinks';
import { PhoneField } from '../components/PhoneField';
import { useGoogleSignIn } from '../hooks/useGoogleSignIn';
import { usePhoneEntry } from '../hooks/usePhoneEntry';
import { AuthConflictAction } from '../components/AuthConflictAction';

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
      trailing={<Brand />}
      footer={<AuthEntrySwitch intent={intent} disabled={busy} />}
    >
      <AuthHeading
        icon={Smartphone}
        title={t('authEntry.' + intent)}
        message={t(
          intent === 'login'
            ? 'authEntry.loginHelper'
            : 'authEntry.registerHelper',
        )}
      />
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
      <AuthConflictAction reason={google.conflict} />
      <LegalLinks showCaption={intent === 'register'} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing[24], paddingBottom: spacing[16] },
});
