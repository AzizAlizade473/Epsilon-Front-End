import type { LucideIcon } from 'lucide-react-native';
import { View, type ColorValue } from 'react-native';

import { colors, layout, spacing } from '@/design';

export type IconProps = {
  icon: LucideIcon;
  size?: 'small' | 'medium' | 'large';
  color?: ColorValue;
} & (
  | { decorative: true; accessibilityLabel?: never }
  | { decorative?: false; accessibilityLabel: string }
);

const sizes = { small: spacing[20], medium: spacing[24], large: spacing[32] };

export function Icon({
  icon: Glyph,
  size = 'medium',
  color = colors.ink,
  decorative = false,
  accessibilityLabel,
}: IconProps) {
  return (
    <View
      accessible={!decorative}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      accessibilityElementsHidden={decorative}
      importantForAccessibility={decorative ? 'no-hide-descendants' : 'yes'}
    >
      <Glyph
        size={sizes[size]}
        strokeWidth={layout.iconStrokeWidth}
        color={color}
        accessible={false}
        focusable={false}
      />
    </View>
  );
}
