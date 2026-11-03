import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { PressSurface, type PressSurfaceProps } from './PressSurface';
import { Text } from './Text';

import { colors, layout, radius, spacing } from '@/design';

const variants = {
  primary: {
    background: colors.brand.primary,
    foreground: colors.surface,
    pressed: colors.brand.primaryPressed,
  },
  secondary: {
    background: colors.brand.tint,
    foreground: colors.brand.primary,
    pressed: colors.brand.border,
  },
  ghost: {
    background: undefined,
    foreground: colors.ink,
    pressed: colors.divider,
  },
  outline: {
    background: colors.surface,
    foreground: colors.ink,
    pressed: colors.divider,
  },
  destructive: {
    background: colors.danger,
    foreground: colors.surface,
    pressed: colors.danger,
  },
} as const;

export type ButtonProps = Pick<
  PressSurfaceProps,
  'onPress' | 'disabled' | 'loading'
> & {
  label: string;
  accessibilityLabel?: string;
  variant?: keyof typeof variants;
  shape?: 'pill' | 'rounded';
};

export function Button({
  label,
  accessibilityLabel = label,
  variant = 'primary',
  loading = false,
  shape = 'rounded',
  ...props
}: ButtonProps) {
  const palette = variants[variant];
  return (
    <PressSurface
      {...props}
      loading={loading}
      accessibilityLabel={accessibilityLabel}
      pressedColor={palette.pressed}
      style={[
        styles.button,
        { backgroundColor: palette.background },
        shape === 'rounded' && { borderRadius: radius[12] },
        variant === 'outline' && {
          borderWidth: layout.hairlineWidth,
          borderColor: colors.border,
        },
      ]}
      contentStyle={styles.content}
    >
      <View style={{ opacity: loading ? 0 : 1 }}>
        <Text
          variant="headline"
          style={[styles.label, { color: palette.foreground }]}
        >
          {label}
        </Text>
      </View>
      {loading && (
        <ActivityIndicator
          color={palette.foreground}
          style={StyleSheet.absoluteFill}
        />
      )}
    </PressSurface>
  );
}

const styles = StyleSheet.create({
  button: { borderRadius: radius.pill, overflow: 'hidden', width: '100%' },
  content: {
    minHeight: layout.controlHeight,
    paddingHorizontal: spacing[24],
    paddingVertical: spacing[16],
  },
  label: { textAlign: 'center' },
});
