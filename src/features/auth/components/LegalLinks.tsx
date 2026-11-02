import { useCallback, useRef } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Keyboard, StyleSheet, View } from 'react-native';
import { PressSurface } from '@/components/ui/PressSurface';
import { Text } from '@/components/ui/Text';
import { colors, spacing } from '@/design';

export function LegalLinks({ showCaption = true }: { showCaption?: boolean }) {
  const { t } = useTranslation();
  const router = useRouter();
  const gate = useRef(false);
  useFocusEffect(
    useCallback(() => {
      gate.current = false;
    }, []),
  );
  return (
    <View style={styles.group}>
      {showCaption && (
        <Text variant="caption" style={styles.caption}>
          {t('auth.legal')}
        </Text>
      )}
      <View style={styles.links}>
        {(['terms', 'privacy'] as const).map((key) => (
          <PressSurface
            key={key}
            accessibilityRole="link"
            accessibilityLabel={t(`auth.${key}`)}
            onPress={() => {
              if (gate.current) return;
              gate.current = true;
              Keyboard.dismiss();
              router.push(key === 'terms' ? '/legal/terms' : '/legal/privacy');
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
