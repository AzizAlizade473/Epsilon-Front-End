import type { IconProps } from './Icon';
import { Icon } from './Icon';
import { Text } from './Text';
import { StyleSheet, View } from 'react-native';
import { colors, layout, radius, spacing } from '@/design';

export function AuthHeading({
  title,
  message,
  icon,
}: {
  title: string;
  message?: string;
  icon: IconProps['icon'];
}) {
  return (
    <View style={styles.heading}>
      <View style={styles.mark}>
        <Icon
          icon={icon}
          size="large"
          color={colors.brand.primary}
          decorative
        />
      </View>
      <Text variant="title1" accessibilityRole="header">
        {title}
      </Text>
      {message && <Text tone="secondary">{message}</Text>}
    </View>
  );
}
const styles = StyleSheet.create({
  heading: { gap: spacing[12], paddingVertical: spacing[16] },
  mark: {
    width: layout.controlHeight,
    height: layout.controlHeight,
    borderRadius: radius[16],
    backgroundColor: colors.brand.tint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[8],
  },
});
