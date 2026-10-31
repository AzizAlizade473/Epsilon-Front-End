import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { googleG } from '../../../../assets/brand/google-g';
import { PressSurface } from '@/components/ui/PressSurface';
import { Text } from '@/components/ui/Text';
import { colors, layout, radius, spacing } from '@/design';

export function GoogleButton({
  disabled,
  onPress,
}: {
  disabled?: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  return (
    <PressSurface
      accessibilityLabel={t('auth.continueGoogle')}
      disabled={disabled}
      onPress={onPress}
      style={styles.button}
      contentStyle={styles.content}
    >
      <SvgXml
        xml={googleG}
        width={spacing[20]}
        height={spacing[20]}
        accessible={false}
      />
      <Text variant="headline" style={styles.label}>
        {t('auth.continueGoogle')}
      </Text>
    </PressSurface>
  );
}
const styles = StyleSheet.create({
  button: {
    borderRadius: radius.pill,
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
