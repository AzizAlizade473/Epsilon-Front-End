import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { BackButton } from '@/components/navigation/BackButton';
import { BrandMark } from '@/components/ui/Brand';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { env } from '@/lib/env';
import { colors, layout, radius, spacing } from '@/design';
import {
  AuthEntrySwitch,
  GoogleEntry,
  type AuthIntent,
} from '../components/AuthEntryActions';
import { LegalLinks } from '../components/LegalLinks';
import { EmailField } from '../components/EmailField';
import { PhoneField } from '../components/PhoneField';
import { Rise } from '../components/Rise';
import { WaveHeader } from '../components/WaveHeader';
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
      edges={['bottom', 'left', 'right']}
      contentStyle={styles.bleed}
      footer={<AuthEntrySwitch intent={intent} disabled={busy} />}
    >
      <WaveHeader height={layout.authHeaderHeight}>
        <Rise order={0} style={styles.topRow}>
          <BackButton
            tone="inverse"
            onPress={() => {
              if (!busy) {
                if (router.canGoBack()) router.back();
                else router.replace('/welcome');
              }
            }}
          />
          <BrandMark inverse />
        </Rise>
      </WaveHeader>
      <View style={styles.body}>
        <Rise order={1} style={styles.heading}>
          <Text
            variant="title1"
            accessibilityRole="header"
            style={styles.title}
          >
            {t('authEntry.' + intent)}
          </Text>
          <View style={styles.accent} />
          <Text tone="secondary">
            {t(
              intent === 'login'
                ? 'authEntry.loginHelper'
                : 'authEntry.registerHelper',
            )}
          </Text>
        </Rise>
        <Rise order={2}>
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
        </Rise>
        <Rise order={3} style={styles.fields}>
          <PhoneField
            appearance="underline"
            autoFocus={false}
            value={phone.phone}
            onChange={phone.onChange}
            disabled={busy}
            error={phone.error}
            onSubmit={submit}
          />
          <EmailField
            appearance="underline"
            value={phone.email}
            onChange={phone.onEmailChange}
            disabled={busy}
            error={phone.emailError}
            onSubmit={submit}
          />
        </Rise>
        <AuthConflictAction reason={phone.conflict ?? google.conflict} />
        <Rise order={4}>
          <Button
            shape="rounded"
            label={t(phone.hasCode ? 'auth.enterCode' : 'common.continue')}
            loading={phone.busy}
            disabled={phone.disabled || google.busy}
            onPress={submit}
          />
        </Rise>
        <Rise order={5}>
          <LegalLinks showCaption={intent === 'register'} />
        </Rise>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fields: { gap: spacing[20] },
  bleed: { padding: 0, gap: 0 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: -spacing[12],
  },
  body: {
    paddingHorizontal: spacing.screenMargin,
    paddingTop: spacing[8],
    gap: spacing[24],
  },
  heading: { gap: spacing[8] },
  title: { color: colors.brand.deep, fontWeight: '700' },
  accent: {
    width: layout.titleAccentWidth,
    height: layout.titleAccentHeight,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.secondary,
    marginBottom: spacing[4],
  },
});
