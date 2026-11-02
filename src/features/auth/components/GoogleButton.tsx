import { decorativeSvgProps } from '@/lib/decorative-svg';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { googleG } from '../../../../assets/brand/google-g';
import { PressSurface } from '@/components/ui/PressSurface';
import { Text } from '@/components/ui/Text';
import { colors, layout, radius, spacing } from '@/design';

export function GoogleButton({
  disabled,
  onPress,
  loading = false,
}: {
  disabled?: boolean;
  onPress: () => void;
  loading?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <PressSurface
      accessibilityLabel={t('auth.continueGoogle')}
      disabled={disabled}
      loading={loading}
      onPress={onPress}
      style={styles.button}
      contentStyle={styles.content}
    >
      <View style={[styles.row, { opacity: loading ? 0 : 1 }]}>
        <SvgXml
          xml={googleG}
          width={spacing[20]}
          height={spacing[20]}
          {...decorativeSvgProps}
        />
        <Text variant="headline" style={styles.label}>
          {t('auth.continueGoogle')}
        </Text>
      </View>
      {loading && (
        <ActivityIndicator color={colors.ink} style={StyleSheet.absoluteFill} />
      )}
    </PressSurface>
  );
}
const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    flexShrink: 1,
  },
  button: {
    borderRadius: radius[12],
    borderWidth: layout.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  content: {
    minHeight: layout.controlHeight,
    flexDirection: 'row',
    gap: spacing[12],
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[16],
  },
  label: { flexShrink: 1, textAlign: 'center' },
});
