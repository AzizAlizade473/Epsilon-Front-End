import { useEffect, type ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { motionTokens } from '@/design';

const easeOut = Easing.bezier(0.23, 1, 0.32, 1);

/**
 * Mount-time fade + short rise, staggered by `order` (capped). Shared values
 * instead of layout `entering` so web keeps normal flow. Reduce Motion: none.
 */
export function Reveal({
  order = 0,
  style,
  children,
}: {
  order?: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (reduced) return progress.set(1);
    progress.set(
      withDelay(
        Math.min(order, motionTokens.listStaggerMax) *
          motionTokens.authEnterStagger,
        withTiming(1, {
          duration: motionTokens.authEnterDuration,
          easing: easeOut,
        }),
      ),
    );
  }, [progress, order, reduced]);
  const animated = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [
      { translateY: (1 - progress.get()) * motionTokens.authEnterRise },
    ],
  }));
  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}
