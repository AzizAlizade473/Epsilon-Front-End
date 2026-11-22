import {
  BottomTabBarHeightCallbackContext,
  type BottomTabBarProps,
} from 'expo-router/js-tabs';
import House from 'lucide-react-native/icons/house';
import Utensils from 'lucide-react-native/icons/utensils';
import UserRound from 'lucide-react-native/icons/user-round';
import ScanLine from 'lucide-react-native/icons/scan-line';
import { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Icon } from './Icon';
import { PressSurface } from './PressSurface';
import { Text } from './Text';
import { colors, layout, radius, spacing } from '@/design';

const pillTabs = [
  { name: 'home', icon: House, label: 'home' },
  { name: 'restaurants', icon: Utensils, label: 'restaurants' },
  { name: 'profile', icon: UserRound, label: 'profile' },
] as const;
const settle = { duration: 380, dampingRatio: 0.9 } as const;
const barHeight = layout.tabBarHeight - spacing[8];
const inset = spacing[4] + spacing[4] / 2;
/** Compact highlight like the reference: hugs icon + label, never the full slot. */
const highlightWidth = layout.controlHeight + spacing[16];
const scanCore = barHeight - inset * 2;
/** Tabs sit close together, iOS-style: fixed slots, the pill hugs them. */
const slotWidth = layout.controlHeight + spacing[24];
/** Frosted glass on web; native falls back to near-opaque (no blur dependency). */
const glass: ViewStyle =
  Platform.OS === 'web'
    ? ({
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      } as ViewStyle)
    : {};

type Slot = { x: number; width: number };
const gap = spacing[8] + spacing[4] / 2;

/**
 * iOS-style floating glass bar over content: a compact pill of real
 * destinations plus a matching round Scan button with a navy core. One
 * highlight slides between tabs (transform + width on an absolute, childless
 * view, so nothing else re-lays-out). Height is reported so screens can inset.
 */
export function TabBar({
  state,
  emitter,
  navigateToTab,
  insets,
}: BottomTabBarProps) {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const reportHeight = useContext(BottomTabBarHeightCallbackContext);
  const [slots, setSlots] = useState<Record<string, Slot>>({});
  // Three tabs + Scan must fit a 360 dp phone: slots shrink to the space left.
  const screen = useWindowDimensions().width;
  const slot = Math.min(
    slotWidth,
    (screen -
      insets.left -
      insets.right -
      spacing[16] * 2 -
      barHeight -
      gap -
      inset * 2) /
      pillTabs.length,
  );
  const x = useSharedValue(0);
  const width = useSharedValue(0);
  const activeName = state.routes[state.index]?.name;
  const active = activeName ? slots[activeName] : undefined;
  useEffect(() => {
    if (!active) return;
    const size = Math.min(highlightWidth, active.width);
    const left = active.x + (active.width - size) / 2;
    const first = width.get() === 0;
    x.set(first || reduced ? left : withSpring(left, settle));
    width.set(first || reduced ? size : withSpring(size, settle));
  }, [active, reduced, x, width]);
  const highlight = useAnimatedStyle(() => ({
    width: width.get(),
    opacity: width.get() > 0 ? 1 : 0,
    transform: [{ translateX: x.get() }],
  }));
  const go = (name: string) => {
    const route = state.routes.find((r) => r.name === name);
    if (!route) return;
    const selected = route.key === state.routes[state.index]?.key;
    const event = emitter.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });
    if (!selected && !event.defaultPrevented) navigateToTab(route.key);
  };
  const scanSelected = activeName === 'scan';
  return (
    <View
      pointerEvents="box-none"
      onLayout={(event) => reportHeight?.(event.nativeEvent.layout.height)}
      style={[
        styles.bar,
        {
          paddingBottom: Math.max(insets.bottom, spacing[12]),
          paddingLeft: insets.left + spacing[16],
          paddingRight: insets.right + spacing[16],
        },
      ]}
    >
      <View style={[styles.pill, styles.raised, glass]}>
        <Animated.View style={[styles.highlight, highlight]} />
        {pillTabs.map((tab) => {
          const selected = activeName === tab.name;
          const tint = selected ? colors.brand.primary : colors.inkSecondary;
          return (
            <View
              key={tab.name}
              style={{ width: slot }}
              onLayout={(event) => {
                const { x: left, width: size } = event.nativeEvent.layout;
                setSlots((prev) =>
                  prev[tab.name]?.x === left && prev[tab.name]?.width === size
                    ? prev
                    : { ...prev, [tab.name]: { x: left, width: size } },
                );
              }}
            >
              <PressSurface
                accessibilityRole="tab"
                accessibilityLabel={t(`navigation.${tab.name}`)}
                accessibilityState={{ selected }}
                onPress={() => go(tab.name)}
                pressedColor={colors.transparent}
                contentStyle={styles.target}
                spring
              >
                <Icon icon={tab.icon} size="small" color={tint} decorative />
                <Text
                  variant="tab"
                  numberOfLines={1}
                  style={[styles.label, { color: tint }]}
                >
                  {t(`navigation.${tab.label}`)}
                </Text>
              </PressSurface>
            </View>
          );
        })}
      </View>
      <PressSurface
        accessibilityRole="tab"
        accessibilityLabel={t('navigation.scan')}
        accessibilityState={{ selected: scanSelected }}
        onPress={() => go('scan')}
        style={[styles.action, styles.raised, glass]}
        contentStyle={styles.actionTarget}
        pressedColor={colors.transparent}
        spring
      >
        <View
          style={[styles.scanCore, scanSelected && styles.scanCoreSelected]}
        >
          <Icon
            icon={ScanLine}
            size="small"
            color={colors.surface}
            decorative
          />
        </View>
      </PressSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap,
    paddingTop: spacing[4],
  },
  raised: {
    shadowColor: colors.brand.deep,
    shadowOpacity: 0.14,
    shadowRadius: spacing[20],
    shadowOffset: { width: 0, height: spacing[8] },
    elevation: 10,
  },
  pill: {
    flexDirection: 'row',
    height: barHeight,
    padding: inset,
    borderRadius: radius.pill,
    backgroundColor: colors.glass,
    borderWidth: layout.hairlineWidth,
    borderColor: colors.glassEdge,
  },
  highlight: {
    position: 'absolute',
    top: inset,
    bottom: inset,
    left: 0,
    borderRadius: radius[16],
    backgroundColor: colors.brand.tint,
  },
  target: {
    flex: 1,
    minHeight: layout.tapTarget,
    gap: spacing[4] / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius[16],
  },
  label: { textAlign: 'center' },
  action: {
    width: barHeight,
    height: barHeight,
    borderRadius: radius.pill,
    backgroundColor: colors.glass,
    borderWidth: layout.hairlineWidth,
    borderColor: colors.glassEdge,
  },
  actionTarget: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanCore: {
    width: scanCore,
    height: scanCore,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.primary,
  },
  scanCoreSelected: { backgroundColor: colors.brand.secondary },
});
