import { Switch as NativeSwitch } from 'react-native';

import { colors, layout, spacing } from '@/design';

export type SwitchProps = {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
};

export function Switch({
  label,
  value,
  onValueChange,
  disabled = false,
}: SwitchProps) {
  return (
    <NativeSwitch
      accessibilityLabel={label}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      value={value}
      disabled={disabled}
      onValueChange={(next) => {
        if (!disabled) onValueChange(next);
      }}
      trackColor={{ false: colors.inkSecondary, true: colors.brand.primary }}
      thumbColor={colors.surface}
      ios_backgroundColor={colors.inkSecondary}
      hitSlop={spacing[8]}
      style={{ minWidth: layout.tapTarget, minHeight: layout.tapTarget }}
    />
  );
}
