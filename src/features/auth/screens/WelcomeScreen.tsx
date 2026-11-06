import { Brand } from '@/components/ui/Brand';
import { useCallback, useRef, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { colors, spacing } from '@/design';
import { authOperation } from '@/lib/auth-lifecycle';
import { FadeUp } from '../components/FadeUp';
import { LegalLinks } from '../components/LegalLinks';
import { WelcomeArtwork } from '../components/WelcomeArtwork';

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
              <Brand />
            </View>
          </FadeUp>
          <FadeUp order={1}>
            <View style={styles.heading}>
              <Text
                variant="title1"
                accessibilityRole="header"
                style={styles.title}
              >
                {t('authEntry.headline')}
              </Text>
              <Text tone="secondary">{t('authEntry.description')}</Text>
            </View>
          </FadeUp>
          <WelcomeArtwork />
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
              <LegalLinks showCaption={false} />
              <Button
                label={t('premium.browse')}
                variant="ghost"
                onPress={() => router.push('/restaurants')}
              />
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
    paddingVertical: spacing[16],
  },
  content: {
    flexGrow: 1,
    justifyContent: 'space-between',
    gap: spacing[24],
  },
  brand: { alignItems: 'flex-start' },
  heading: { gap: spacing[16] },
  title: { color: colors.brand.deep },
  actions: { gap: spacing[12] },
});
