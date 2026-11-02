import { Image } from 'expo-image';
import { useCallback, useRef, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { colors, layout, spacing } from '@/design';
import { authOperation } from '@/lib/auth-lifecycle';
import { FadeUp } from '../components/FadeUp';
import { LegalLinks } from '../components/LegalLinks';

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const gate = useRef(false);
  const [busy, setBusy] = useState(false);
  useFocusEffect(
    useCallback(() => {
      gate.current = false;
      setBusy(false);
    }, []),
  );
  const open = (route: '/login' | '/register') => {
    if (gate.current || !authOperation.acquire()) return;
    gate.current = true;
    setBusy(true);
    router.push(route);
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
                style={[styles.center, styles.title]}
              >
                {t('authEntry.headline')}
              </Text>
              <Text style={styles.center}>{t('authEntry.description')}</Text>
            </View>
          </FadeUp>
          <FadeUp order={2}>
            <View style={styles.actions}>
              <Button
                label={t('authEntry.login')}
                shape="rounded"
                disabled={busy}
                onPress={() => open('/login')}
              />
              <Button
                label={t('authEntry.register')}
                variant="outline"
                shape="rounded"
                disabled={busy}
                onPress={() => open('/register')}
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
  heading: { gap: spacing[16] },
  title: { color: colors.brand.primary },
  actions: { gap: spacing[12] },
  center: { textAlign: 'center' },
});
