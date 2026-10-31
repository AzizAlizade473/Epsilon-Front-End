import {
  Text as NativeText,
  type TextProps as NativeTextProps,
} from 'react-native';

import { colors, typography, type TypographyVariant } from '@/design';

export type TextProps = Omit<
  NativeTextProps,
  'allowFontScaling' | 'maxFontSizeMultiplier'
> & {
  variant?: TypographyVariant;
  tone?: 'default' | 'secondary' | 'danger' | 'success';
};

const tones = {
  default: colors.ink,
  secondary: colors.inkSecondary,
  danger: colors.danger,
  success: colors.successInk,
} as const;

/** System typography; text always follows the user's font size setting. */
export function Text({
  variant = 'body',
  tone = 'default',
  style,
  ...props
}: TextProps) {
  return (
    <NativeText
      {...props}
      allowFontScaling
      maxFontSizeMultiplier={0}
      style={[typography[variant], { color: tones[tone] }, style]}
    />
  );
}
