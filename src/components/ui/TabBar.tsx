import type { BottomTabBarProps } from 'expo-router/js-tabs';
import House from 'lucide-react-native/icons/house';
import Store from 'lucide-react-native/icons/store';
import User from 'lucide-react-native/icons/user';
import Wallet from 'lucide-react-native/icons/wallet';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { ScanAction } from './ScanAction';
import { TabItem } from './TabItem';

import { colors, layout, spacing } from '@/design';

const tabs = [
  { name: 'home', icon: House },
  { name: 'restaurants', icon: Store },
  { name: 'cashback', icon: Wallet },
  { name: 'profile', icon: User },
] as const;

export function TabBar({
  state,
  emitter,
  navigateToTab,
  insets,
}: BottomTabBarProps) {
  const { t } = useTranslation();
  const [scanHeight, setScanHeight] = useState<number>(
    layout.tabBarHeight + spacing[12],
  );
  const renderTab = (tab: (typeof tabs)[number]) => {
    const route = state.routes.find((item) => item.name === tab.name);
    if (!route) return null;
    const selected = state.routes[state.index]?.key === route.key;
    return (
      <TabItem
        label={t(`navigation.${tab.name}`)}
        icon={tab.icon}
        selected={selected}
        onPress={() => {
          const event = emitter.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!selected && !event.defaultPrevented) navigateToTab(route.key);
        }}
      />
    );
  };
  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      <View pointerEvents="none" style={styles.background} />
      <View
        style={[
          styles.row,
          {
            minHeight: Math.max(layout.tabBarHeight, scanHeight - spacing[12]),
          },
        ]}
      >
        {renderTab(tabs[0])}
        {renderTab(tabs[1])}
        <View style={styles.spacer} />
        {renderTab(tabs[2])}
        {renderTab(tabs[3])}
      </View>
      <View
        style={styles.scan}
        onLayout={(event) => setScanHeight(event.nativeEvent.layout.height)}
      >
        <ScanAction />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { paddingTop: spacing[12], marginTop: -spacing[12] },
  background: {
    ...StyleSheet.absoluteFill,
    top: spacing[12],
    backgroundColor: colors.surface,
    borderTopWidth: layout.hairlineWidth,
    borderTopColor: colors.border,
  },
  row: { flexDirection: 'row' },
  spacer: { width: layout.controlHeight },
  scan: {
    position: 'absolute',
    top: 0,
    left: '50%',
    width: layout.controlHeight,
    marginLeft: -layout.controlHeight / 2,
  },
});
