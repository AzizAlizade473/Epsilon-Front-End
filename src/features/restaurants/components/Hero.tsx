import { memo, type ReactNode } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { LucideIcon } from 'lucide-react-native';
import { Icon } from '@/components/ui/Icon';
import { PressSurface } from '@/components/ui/PressSurface';
import { FoodImage } from '@/components/food/FoodImage';
import { colors, layout, radius, spacing } from '@/design';
import { premium } from '@/design/premium';

/** Round translucent control over photography (back, save). */
export function RoundButton({
  icon,
  label,
  onPress,
  selected,
  fill,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  selected?: boolean;
  fill?: boolean;
}) {
  const Glyph = icon;
  return (
    <PressSurface
      accessibilityLabel={label}
      accessibilityState={selected === undefined ? undefined : { selected }}
      onPress={onPress}
      style={styles.round}
      contentStyle={styles.roundInner}
      spring
    >
      {fill ? (
        <Glyph
          size={spacing[20]}
          strokeWidth={layout.iconStrokeWidth}
          color={colors.surface}
          fill={colors.surface}
        />
      ) : (
        <Icon icon={icon} size="small" color={colors.surface} decorative />
      )}
    </PressSurface>
  );
}

/**
 * Full-bleed photo header. With `scrollY` it parallaxes on scroll and
 * stretches on pull-down (transform only; off under Reduce Motion).
 */
export const Hero = memo(function Hero({
  uri,
  height,
  scrollY,
  leading,
  trailing,
}: {
  uri: string | undefined;
  height: number;
  scrollY?: SharedValue<number>;
  leading: ReactNode;
  trailing?: ReactNode;
}) {
  const width = Math.min(useWindowDimensions().width, layout.contentMaxWidth);
  const top = useSafeAreaInsets().top;
  const reduced = useReducedMotion();
  const motion = useAnimatedStyle(() => {
    if (!scrollY || reduced) return {};
    const y = scrollY.get();
    return {
      transform: [
        {
          translateY:
            y < 0
              ? y / 2
              : interpolate(y, [0, height], [0, height * premium.heroParallax]),
        },
        {
          scale: interpolate(
            y,
            [-height, 0],
            [premium.heroStretch, 1],
            'clamp',
          ),
        },
      ],
    };
  });
  return (
    <View style={[styles.hero, { height }]}>
      <Animated.View style={motion}>
        <FoodImage
          uri={uri}
          cover
          width={width}
          height={height}
          rounded={false}
        />
      </Animated.View>
      <View style={[styles.controls, { top: top + spacing[12] }]}>
        {leading}
        {trailing}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  hero: { overflow: 'visible', backgroundColor: premium.foodCanvas },
  controls: {
    position: 'absolute',
    left: spacing.screenMargin,
    right: spacing.screenMargin,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  round: { borderRadius: radius.pill, overflow: 'hidden' },
  roundInner: {
    width: layout.tapTarget,
    height: layout.tapTarget,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: premium.scrim,
  },
});
