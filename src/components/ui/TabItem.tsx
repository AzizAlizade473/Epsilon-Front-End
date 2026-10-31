import { StyleSheet } from 'react-native';

import { Icon, type IconProps } from './Icon';
import { PressSurface } from './PressSurface';
import { Text } from './Text';

import { colors, layout, spacing } from '@/design';

export type TabItemProps = {
  label: string;
  icon: IconProps['icon'];
  selected: boolean;
  onPress: () => void;
};

export function TabItem({ label, icon, selected, onPress }: TabItemProps) {
  return (
    <PressSurface
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={styles.item}
      contentStyle={styles.content}
      pressedColor={colors.divider}
    >
      <Icon
        icon={icon}
        color={selected ? colors.ink : colors.inkMuted}
        decorative
      />
      <Text
        variant="tab"
        style={{
          color: selected ? colors.ink : colors.inkSecondary,
          textAlign: 'center',
        }}
      >
        {label}
      </Text>
    </PressSurface>
  );
}

const styles = StyleSheet.create({
  item: { flex: 1 },
  content: {
    minHeight: layout.tabBarHeight,
    gap: spacing[4],
    paddingVertical: spacing[8],
  },
});
