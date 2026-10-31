import Check from 'lucide-react-native/icons/check';
import { StyleSheet, View } from 'react-native';

import { Icon } from './Icon';
import { PressSurface } from './PressSurface';
import { Text } from './Text';

import { colors, radius, spacing } from '@/design';

export type SegmentedControlProps<T extends string> = {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onValueChange: (value: T) => void;
  disabled?: boolean;
};

export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onValueChange,
  disabled,
}: SegmentedControlProps<T>) {
  return (
    <View
      style={styles.group}
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
    >
      {options.map((option) => {
        const checked = option.value === value;
        return (
          <PressSurface
            key={option.value}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ checked }}
            disabled={disabled}
            style={[
              styles.segment,
              checked && { backgroundColor: colors.surface },
            ]}
            contentStyle={styles.content}
            pressedColor={colors.brand.tint}
            onPress={() => {
              if (!checked) onValueChange(option.value);
            }}
          >
            {checked && <Icon icon={Check} size="small" decorative />}
            <Text variant="callout" style={styles.label}>
              {option.label}
            </Text>
          </PressSurface>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[4],
    padding: spacing[4],
    borderRadius: radius[16],
    backgroundColor: colors.divider,
  },
  segment: { flex: 1, borderRadius: radius[12], overflow: 'hidden' },
  content: { padding: spacing[8], flexDirection: 'row', gap: spacing[4] },
  label: { flexShrink: 1, textAlign: 'center' },
});
