import { useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import ArrowUpRight from 'lucide-react-native/icons/arrow-up-right';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { Brand } from '@/components/ui/Brand';
import { ContourPattern } from '@/components/ui/ContourPattern';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { decorativeSvgProps } from '@/lib/decorative-svg';
import { colors, layout, radius, spacing, useMotion } from '@/design';
import { walletDesign as w } from '@/design/wallet';
import { formatMoney } from '@/lib/money';

/** One wallet. The colored folds are its receipt/reward layers, never accounts. */
export function WalletSurface({
  children,
  pendingMinor,
  focused = false,
}: {
  children: ReactNode;
  pendingMinor?: number;
  focused?: boolean;
}) {
  const { t } = useTranslation();
  const motion = useMotion();
  const focus = useSharedValue(0);
  useEffect(() => {
    focus.value = motion.reduceMotion
      ? Number(focused)
      : withSpring(Number(focused), w.spring);
  }, [focus, focused, motion.reduceMotion]);
  const fold = useAnimatedStyle(() => ({
    transform: [
      { translateY: -w.card.lift * focus.value },
      { rotate: `${w.card.turn * (1 - focus.value)}deg` },
    ],
  }));
  const back = useAnimatedStyle(() => ({
    transform: [
      { translateY: -w.card.lift * 2 * focus.value },
      { rotate: `${-w.card.turn * (1 - focus.value)}deg` },
    ],
  }));
  return (
    <View style={styles.stack}>
      <Animated.View
        pointerEvents="none"
        style={[styles.layer, styles.back, back]}
      />
      <Animated.View
        pointerEvents="none"
        style={[styles.layer, styles.fold, fold]}
      />
      <View style={styles.wallet}>
        {/* Business-card identity: blue-to-indigo field with faint contour lines. */}
        <Svg
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
          {...decorativeSvgProps}
        >
          <Defs>
            <LinearGradient id="walletField" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={colors.brand.secondary} />
              <Stop offset="1" stopColor={colors.brand.primary} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#walletField)" />
        </Svg>
        <ContourPattern composition="card" opacity={w.contourOpacity} />
        <View style={styles.top}>
          <Brand inverse />
          <View style={styles.seal}>
            <Icon icon={ArrowUpRight} color={colors.surface} decorative />
          </View>
        </View>
        <View style={styles.balance}>
          <Text variant="caption" style={styles.white}>
            {t('home.balance')}
          </Text>
          {children}
        </View>
        <View style={styles.bottom}>
          <View style={styles.receiptMark} accessible={false}>
            <View style={styles.markLine} />
            <View style={[styles.markLine, styles.shortLine]} />
          </View>
          <Text variant="caption" style={[styles.white, styles.flex]}>
            {t('home.universalWallet')}
          </Text>
          {pendingMinor !== undefined && pendingMinor > 0 && (
            <Text variant="caption" style={styles.white}>
              {t('home.pending', { amount: formatMoney(pendingMinor) })}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  stack: { paddingTop: spacing[16], paddingBottom: spacing[8] },
  layer: {
    position: 'absolute',
    top: spacing[8],
    bottom: spacing[20],
    left: spacing[12],
    right: spacing[12],
    borderRadius: radius[24],
  },
  back: { backgroundColor: w.colors.back },
  fold: {
    backgroundColor: w.colors.fold,
    top: spacing[12],
    left: spacing[4],
    right: spacing[4],
  },
  wallet: {
    backgroundColor: w.colors.card,
    borderRadius: w.card.radius,
    padding: spacing[24],
    gap: spacing[16],
    overflow: 'hidden',
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seal: {
    width: layout.tapTarget,
    height: layout.tapTarget,
    borderRadius: radius.pill,
    borderWidth: layout.borderWidth,
    borderColor: w.colors.sheen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balance: { gap: spacing[4], paddingVertical: spacing[8] },
  bottom: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[8],
    alignItems: 'center',
    borderTopWidth: layout.hairlineWidth,
    borderTopColor: w.colors.muted,
    paddingTop: spacing[16],
  },
  flex: { flexGrow: 1, flexBasis: '50%' },
  white: { color: colors.surface },
  receiptMark: {
    gap: spacing[4],
    padding: spacing[4],
    borderWidth: layout.borderWidth,
    borderColor: w.colors.muted,
    borderRadius: spacing[4],
  },
  markLine: {
    width: spacing[12],
    height: layout.borderWidth,
    backgroundColor: colors.surface,
  },
  shortLine: { width: spacing[8] },
});
