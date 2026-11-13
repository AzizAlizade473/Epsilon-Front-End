import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { BackButton } from '@/components/navigation/BackButton';
import { Brand } from '@/components/ui/Brand';
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
import { PhoneField } from '../components/PhoneField';
import { enter } from '../components/entrance';
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
        <Animated.View entering={enter(0)} style={styles.topRow}>
          <BackButton
            tone="inverse"
            onPress={() => {
              if (!busy) {
                if (router.canGoBack()) router.back();
                else router.replace('/welcome');
              }
            }}
          />
          <Brand inverse />
        </Animated.View>
      </WaveHeader>
      <View style={styles.body}>
        <Animated.View entering={enter(1)} style={styles.heading}>
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
        </Animated.View>
        <Animated.View entering={enter(2)}>
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
        </Animated.View>
        <AuthConflictAction reason={google.conflict} />
        <Animated.View entering={enter(3)}>
          <PhoneField
            appearance="underline"
            autoFocus={false}
            value={phone.phone}
            onChange={phone.onChange}
            disabled={busy}
            error={phone.error}
            onSubmit={submit}
          />
        </Animated.View>
        <Animated.View entering={enter(4)}>
          <Button
            shape="rounded"
            label={t(phone.hasCode ? 'auth.enterCode' : 'common.continue')}
            loading={phone.busy}
            disabled={phone.disabled || google.busy}
            onPress={submit}
          />
        </Animated.View>
        <Animated.View entering={enter(5)}>
          <LegalLinks showCaption={intent === 'register'} />
        </Animated.View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
