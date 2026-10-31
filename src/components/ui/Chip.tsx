import Check from 'lucide-react-native/icons/check';
import { StyleSheet, View } from 'react-native';

import { Icon } from './Icon';
import { PressSurface } from './PressSurface';
import { Text } from './Text';

import { colors, layout, radius, spacing } from '@/design';

const tints = {
  neutral: colors.divider,
  brand: colors.brand.tint,
  success: colors.successTint,
  warning: colors.warningTint,
  danger: colors.dangerTint,
} as const;
export type ChipProps = {
  label: string;
  tone?: keyof typeof tints;
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
};

export function Chip({
  label,
  tone = 'neutral',
  selected = false,
  disabled,
  onPress,
}: ChipProps) {
  const style = [
    styles.chip,
    {
      backgroundColor: tints[tone],
      borderColor: selected ? colors.brand.primary : tints[tone],
    },
  ];
  const content = (
    <View style={styles.content}>
      {selected && <Icon icon={Check} size="small" decorative />}
      <Text variant="caption" style={styles.label}>
        {label}
      </Text>
    </View>
  );
  return onPress ? (
    <PressSurface
      style={style}
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      disabled={disabled}
      onPress={onPress}
      pressedColor={colors.brand.border}
    >
      {content}
    </PressSurface>
  ) : (
    <View style={style}>{content}</View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    borderWidth: layout.hairlineWidth,
    overflow: 'hidden',
  },
  content: {
    minHeight: spacing[32],
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  label: { flexShrink: 1 },
});
