import { useEffect } from 'react';
import { Animated, type DimensionValue } from 'react-native';
import { useAnimatedValue } from '@/hooks/useAnimatedValue';

import { colors, layout, radius, useMotion } from '@/design';

export type SkeletonProps = {
  width: DimensionValue;
  height: number;
  accessibilityLabel?: string;
};

export function Skeleton({ width, height, accessibilityLabel }: SkeletonProps) {
  const opacity = useAnimatedValue(1);
  const { reduceMotion, easing } = useMotion();
  useEffect(() => {
    if (reduceMotion) {
      opacity.setValue(1);
      return;
    }
    const settings = {
      duration: layout.skeletonPulseDuration,
      easing,
      useNativeDriver: true,
    };
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          ...settings,
          toValue: layout.skeletonMinOpacity,
        }),
        Animated.timing(opacity, { ...settings, toValue: 1 }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity, reduceMotion, easing]);
  return (
    <Animated.View
      accessible={Boolean(accessibilityLabel)}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityElementsHidden={!accessibilityLabel}
      importantForAccessibility={
        accessibilityLabel ? 'yes' : 'no-hide-descendants'
      }
      style={{
        width,
        height,
        opacity,
        backgroundColor: colors.divider,
        borderRadius: radius[12],
      }}
    />
  );
}
