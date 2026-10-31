import { useCallback, useRef, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import ScanLine from 'lucide-react-native/icons/scan-line';
import Star from 'lucide-react-native/icons/star';
import Wallet from 'lucide-react-native/icons/wallet';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { ListRow } from '@/components/ui/ListRow';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { spacing } from '@/design';
import { env } from '@/lib/env';
import { useToast } from '@/providers/ToastProvider';
import { FadeUp } from '../components/FadeUp';
import { LegalLinks } from '../components/LegalLinks';
import { GoogleButton } from '../components/GoogleButton';

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const toast = useToast();
  const gate = useRef(false);
  const [busy, setBusy] = useState(false);
  useFocusEffect(
    useCallback(() => {
      gate.current = false;
      setBusy(false);
    }, []),
  );
  const phone = () => {
    if (gate.current) return;
    gate.current = true;
    setBusy(true);
    router.push('/phone');
  };
  return (
    <Screen
      footer={
        <FadeUp order={4}>
          <View style={styles.actions}>
            {env.ENABLE_GOOGLE_SIGNIN && (
              <>
                <GoogleButton
                  disabled={busy}
                  onPress={() => toast(t('auth.socialUnavailable'))}
                />
                <Text variant="caption" style={styles.center}>
                  {t('auth.or')}
                </Text>
              </>
            )}
            <Button
              label={t('auth.continuePhone')}
              loading={busy}
              onPress={phone}
            />
            <LegalLinks />
          </View>
        </FadeUp>
      }
    >
      <FadeUp order={0}>
        <Text variant="title1" accessibilityLabel={t('auth.brand')}>
          {t('auth.brand')}
        </Text>
      </FadeUp>
      <FadeUp order={1}>
        <View style={styles.heading}>
          <Text variant="title1" accessibilityRole="header">
            {t('auth.welcomeTitle')}
          </Text>
          <Text>{t('auth.welcomeBody')}</Text>
        </View>
      </FadeUp>
      <FadeUp order={2}>
        <View>
          <ListRow title={t('auth.scanStep')} icon={ScanLine} divider={false} />
          <ListRow title={t('auth.rateStep')} icon={Star} divider={false} />
          <ListRow title={t('auth.rewardStep')} icon={Wallet} divider={false} />
        </View>
      </FadeUp>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { paddingTop: spacing[24], gap: spacing[12] },
  actions: { gap: spacing[12] },
  center: { textAlign: 'center' },
});
