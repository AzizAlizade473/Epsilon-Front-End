import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import ChevronDown from 'lucide-react-native/icons/chevron-down';
import Clock from 'lucide-react-native/icons/clock';
import CircleCheck from 'lucide-react-native/icons/circle-check';
import { Icon } from '@/components/ui/Icon';
import { PressSurface } from '@/components/ui/PressSurface';
import { Text } from '@/components/ui/Text';
import { layout, radius, spacing, useMotion } from '@/design';
import { walletDesign as w } from '@/design/wallet';
import { formatMoney } from '@/lib/money';

export function WalletDetails({
  balanceMinor,
  pendingMinor,
  expanded,
  onToggle,
}: {
  balanceMinor?: number;
  pendingMinor?: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  const motion = useMotion();
  const [height, setHeight] = useState(0);
  const reveal = useSharedValue(0);
  useEffect(() => {
    reveal.value = motion.reduceMotion
      ? Number(expanded)
      : withSpring(Number(expanded), w.spring);
  }, [expanded, motion.reduceMotion, reveal]);
  const body = useAnimatedStyle(() => ({
    height: height * reveal.value,
    opacity: reveal.value,
  }));
  const arrow = useAnimatedStyle(() => ({
    transform: [{ rotate: `${180 * reveal.value}deg` }],
  }));
  return (
    <View style={styles.panel}>
      <PressSurface
        accessibilityLabel={t('walletMotion.details')}
        accessibilityState={{ expanded }}
        onPress={onToggle}
        contentStyle={styles.toggle}
        spring
      >
        <View style={styles.pendingIcon}>
          <Icon icon={Clock} color={w.colors.muted} decorative size="small" />
        </View>
        <View style={styles.copy}>
          <Text variant="caption" style={styles.muted}>
            {t('walletMotion.pending')}
          </Text>
          <Text variant="headline" tone="inverse">
            {pendingMinor === undefined
              ? t('common.loading')
              : formatMoney(pendingMinor)}
          </Text>
        </View>
        <Animated.View style={arrow}>
          <Icon
            icon={ChevronDown}
            color={w.colors.muted}
            decorative
            size="small"
          />
        </Animated.View>
      </PressSurface>
      <Animated.View
        style={[styles.clip, body]}
        pointerEvents={expanded ? 'auto' : 'none'}
        accessibilityElementsHidden={!expanded}
        importantForAccessibility={expanded ? 'auto' : 'no-hide-descendants'}
      >
        <View
          style={styles.measured}
          onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
        >
          <View style={styles.detailRow}>
            <Icon
              icon={CircleCheck}
              color={w.colors.positive}
              decorative
              size="small"
            />
            <Text style={[styles.copy, styles.white]} variant="callout">
              {t('home.balance')}
            </Text>
            <Text variant="headline" tone="inverse">
              {balanceMinor === undefined
                ? t('common.loading')
                : formatMoney(balanceMinor)}
            </Text>
          </View>
          <Text variant="caption" style={styles.muted}>
            {t('walletMotion.pendingHelp')}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}
const styles = StyleSheet.create({
  panel: {
    backgroundColor: w.colors.raised,
    borderRadius: radius[20],
    borderWidth: layout.hairlineWidth,
    borderColor: w.colors.line,
  },
  toggle: {
    flexDirection: 'row',
    gap: spacing[12],
    padding: spacing[16],
    justifyContent: 'flex-start',
  },
  pendingIcon: {
    width: layout.leadingIconSize,
    height: layout.leadingIconSize,
    borderRadius: radius.pill,
    backgroundColor: w.colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, minWidth: 0 },
  muted: { color: w.colors.muted },
  white: { color: w.colors.text },
  clip: { overflow: 'hidden' },
  measured: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    padding: spacing[16],
    paddingTop: 0,
    gap: spacing[12],
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
    borderTopWidth: layout.hairlineWidth,
    borderTopColor: w.colors.line,
    paddingTop: spacing[16],
  },
});
