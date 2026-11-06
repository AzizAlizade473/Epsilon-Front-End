import type { BottomTabBarProps } from 'expo-router/js-tabs';
import House from 'lucide-react-native/icons/house';
import Utensils from 'lucide-react-native/icons/utensils';
import UserRound from 'lucide-react-native/icons/user-round';
import ScanLine from 'lucide-react-native/icons/scan-line';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Icon } from './Icon';
import { PressSurface } from './PressSurface';
import { Text } from './Text';
import { colors, layout, radius, spacing } from '@/design';

const tabs = [
  { name: 'home', icon: House },
  { name: 'restaurants', icon: Utensils },
  { name: 'scan', icon: ScanLine },
  { name: 'profile', icon: UserRound },
] as const;

/** Four real destinations. Scan is an emphasized tab, never a fifth action. */
export function TabBar({
  state,
  emitter,
  navigateToTab,
  insets,
}: BottomTabBarProps) {
  const { t } = useTranslation();
  return (
    <View
      style={[
        styles.bar,
        {
          paddingBottom: Math.max(insets.bottom, spacing[8]),
          paddingLeft: insets.left + spacing[8],
          paddingRight: insets.right + spacing[8],
        },
      ]}
    >
      {tabs.map((tab) => {
        const route = state.routes.find((r) => r.name === tab.name);
        if (!route) return null;
        const selected = route.key === state.routes[state.index]?.key;
        const scan = tab.name === 'scan';
        return (
          <PressSurface
            key={tab.name}
            accessibilityRole="tab"
            accessibilityLabel={t(`navigation.${tab.name}`)}
            accessibilityState={{ selected }}
            onPress={() => {
              const event = emitter.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!selected && !event.defaultPrevented)
                navigateToTab(route.key);
            }}
            style={styles.item}
            contentStyle={styles.target}
            spring
          >
            <View
              style={[
                styles.icon,
                selected && styles.selected,
                scan && styles.scan,
              ]}
            >
              <Icon
                icon={tab.icon}
                color={
                  scan
                    ? colors.surface
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
                color:
                  selected || scan ? colors.brand.primary : colors.inkSecondary,
                textAlign: 'center',
              }}
            >
              {t(`navigation.${tab.name}`)}
            </Text>
          </PressSurface>
        );
      })}
    </View>
  );
}
const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: layout.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing[8],
  },
  item: { flex: 1 },
  target: { gap: spacing[4], minHeight: layout.tabBarHeight },
  icon: {
    width: layout.controlHeight,
    height: layout.tapTarget,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: { backgroundColor: colors.brand.tint },
  scan: {
    height: layout.controlHeight,
    backgroundColor: colors.brand.primary,
    marginTop: -spacing[16],
    borderWidth: spacing[4],
    borderColor: colors.surface,
  },
});
