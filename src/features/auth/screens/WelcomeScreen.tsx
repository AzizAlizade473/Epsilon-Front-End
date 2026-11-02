import { Image } from 'expo-image';
import { useCallback, useRef, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { layout, spacing } from '@/design';
import { env } from '@/lib/env';
import { useGoogleSignIn } from '../hooks/useGoogleSignIn';
import { authOperation } from '@/lib/auth-lifecycle';
import { FadeUp } from '../components/FadeUp';
import { LegalLinks } from '../components/LegalLinks';
import { GoogleButton } from '../components/GoogleButton';

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const google = useGoogleSignIn();
  const gate = useRef(false);
  const [busy, setBusy] = useState(false);
  useFocusEffect(
    useCallback(() => {
      gate.current = false;
      setBusy(false);
    }, []),
  );
  const phone = () => {
    if (gate.current || google.busy || !authOperation.acquire()) return;
    gate.current = true;
    setBusy(true);
    router.push('/phone');
    authOperation.release();
  };
  return (
    <Screen surface="surface">
      <View style={styles.stage}>
        <View style={styles.content}>
          <FadeUp order={0}>
            <View style={styles.brand}>
              <Image
                source={require('../../../../assets/brand/epsilon-logo.png')}
                style={styles.logo}
                contentFit="contain"
                accessibilityLabel={t('auth.brand')}
              />
            </View>
          </FadeUp>
          <FadeUp order={1}>
            <View style={styles.heading}>
              <Text
                variant="title1"
                accessibilityRole="header"
                style={styles.center}
              >
                {t('authEntry.headline')}
              </Text>
              <Text style={styles.center}>{t('authEntry.description')}</Text>
            </View>
          </FadeUp>
          <FadeUp order={4}>
            <View style={styles.actions}>
              {google.error && (
                <Text
                  accessibilityRole="alert"
                  accessibilityLiveRegion="polite"
                  tone="danger"
                >
                  {google.error}
                </Text>
              )}
              {env.ENABLE_GOOGLE_SIGNIN && (
                <>
                  <GoogleButton
                    disabled={busy || google.busy}
                    loading={google.busy}
                    onPress={() => {
                      void google.signIn().then((route) => {
                        if (route) router.replace(route);
                      });
                    }}
                  />
                  <Text variant="caption" style={styles.center}>
                    {t('auth.or')}
                  </Text>
                </>
              )}
              <Button
                label={t('auth.continuePhone')}
                loading={busy}
                disabled={google.busy}
                onPress={phone}
              />
              <LegalLinks />
            </View>
          </FadeUp>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stage: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: spacing[24],
  },
  content: {
    flexGrow: 1,
    justifyContent: 'space-between',
    gap: spacing[32],
  },
  brand: { alignItems: 'center' },
  logo: { width: layout.authLogoSize, height: layout.authLogoSize },
  heading: { gap: spacing[12] },
  actions: { gap: spacing[12] },
  center: { textAlign: 'center' },
});
