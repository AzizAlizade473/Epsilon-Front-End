import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { openBrowserAsync } from 'expo-web-browser';
import { StyleSheet, View } from 'react-native';
import { PressSurface } from '@/components/ui/PressSurface';
import { Text } from '@/components/ui/Text';
import { colors, spacing } from '@/design';
import { env } from '@/lib/env';
import { useToast } from '@/providers/ToastProvider';

export function LegalLinks() {
  const { t } = useTranslation();
  const toast = useToast();
  const gate = useRef(false);
  const [busy, setBusy] = useState(false);
  const open = async (url: string) => {
    if (gate.current) return;
    gate.current = true;
    setBusy(true);
    try {
      await openBrowserAsync(url);
    } catch {
      toast(t('errors.generic'));
    } finally {
      gate.current = false;
      setBusy(false);
    }
  };
  return (
    <View style={styles.group}>
      <Text variant="caption" style={styles.caption}>
        {t('auth.legal')}
      </Text>
      <View style={styles.links}>
        {(['terms', 'privacy'] as const).map((key) => (
          <PressSurface
            key={key}
            accessibilityRole="link"
            accessibilityLabel={t(`auth.${key}`)}
            disabled={busy}
            onPress={() => {
              void open(
                key === 'terms'
                  ? env.EXPO_PUBLIC_TERMS_URL
                  : env.EXPO_PUBLIC_PRIVACY_URL,
              );
            }}
            contentStyle={styles.link}
          >
            <Text variant="caption" style={styles.label}>
              {t(`auth.${key}`)}
            </Text>
          </PressSurface>
        ))}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  group: { gap: spacing[4] },
  caption: { textAlign: 'center' },
  links: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  link: { paddingHorizontal: spacing[8], paddingVertical: spacing[8] },
  label: {
    color: colors.brand.primary,
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
});
