import { StyleSheet, View, type ViewProps } from 'react-native';

import { colors, layout, radius, spacing } from '@/design';

export function Card({ style, ...props }: ViewProps) {
  return <View {...props} style={[styles.card, style]} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: layout.hairlineWidth,
    borderRadius: radius[20],
    padding: spacing[16],
  },
});
