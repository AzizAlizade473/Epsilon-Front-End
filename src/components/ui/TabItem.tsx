import { StyleSheet, View } from 'react-native';

import { Icon, type IconProps } from './Icon';
import { PressSurface } from './PressSurface';
import { Text } from './Text';

import { colors, layout, spacing } from '@/design';
import { walletDesign as w } from '@/design/wallet';

export type TabItemProps = {
  label: string;
  icon: IconProps['icon'];
  selected: boolean;
  onPress: () => void;
  inverse?: boolean;
};

export function TabItem({
  label,
  icon,
  selected,
  onPress,
  inverse = false,
}: TabItemProps) {
  return (
    <PressSurface
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={styles.item}
      contentStyle={styles.content}
      pressedColor={inverse ? w.colors.raised : colors.divider}
    >
      <View
        style={[
          styles.icon,
          selected && styles.selected,
          inverse && selected && { backgroundColor: w.colors.raised },
        ]}
      >
        <Icon
          icon={icon}
          color={
            inverse
              ? selected
                ? w.colors.text
                : w.colors.muted
              : selected
                ? colors.brand.primary
                : colors.inkSecondary
          }
          decorative
        />
      </View>
      <Text
        variant="tab"
        style={{
          color: inverse
            ? selected
              ? w.colors.text
              : w.colors.muted
            : selected
              ? colors.brand.primary
              : colors.inkSecondary,
          textAlign: 'center',
        }}
      >
        {label}
      </Text>
    </PressSurface>
  );
}

const styles = StyleSheet.create({
  icon: {
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[4],
    borderRadius: spacing[12],
  },
  selected: { backgroundColor: colors.brand.tint },
  item: { flex: 1 },
  content: {
    minHeight: layout.tabBarHeight,
    gap: spacing[4],
    paddingVertical: spacing[8],
  },
});
