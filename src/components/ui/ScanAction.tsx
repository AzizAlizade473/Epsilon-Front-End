import { useFocusEffect, useRouter } from 'expo-router';
import ScanLine from 'lucide-react-native/icons/scan-line';
import { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Icon } from './Icon';
import { PressSurface } from './PressSurface';
import { Text } from './Text';

import { colors, layout, motionTokens, radius, spacing } from '@/design';

export function ScanAction() {
  const router = useRouter();
  const locked = useRef(false);
  const { t } = useTranslation();
  useFocusEffect(
    useCallback(() => {
      locked.current = false;
    }, []),
  );
  return (
    <View style={styles.action}>
      <PressSurface
        accessibilityLabel={t('navigation.scan')}
        style={styles.circle}
        contentStyle={styles.circle}
        spring
        pressScale={motionTokens.scanPressScale}
        pressedColor={colors.brand.primaryPressed}
        onPress={() => {
          if (locked.current) return;
          locked.current = true;
          router.push('/scan');
        }}
      >
        <Icon icon={ScanLine} color={colors.surface} decorative />
      </PressSurface>
      <Text variant="tab">{t('navigation.scanTab')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  action: { alignItems: 'center', gap: spacing[4] },
  circle: {
    width: layout.controlHeight,
    minHeight: layout.controlHeight,
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: colors.brand.primary,
  },
});
