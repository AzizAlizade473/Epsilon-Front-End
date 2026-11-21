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

/** Strong ease-out: fast start, long soft settle (no overshoot on non-gesture motion). */
export const easeOut = Easing.bezier(0.23, 1, 0.32, 1);

/**
 * Mount-time fade + short rise, staggered by `order`. Shared values instead of
 * layout `entering` so web keeps normal flow. Reduce Motion: fade only, no rise.
 */
export function Rise({
  order = 0,
  rise = true,
  duration = motionTokens.authEnterDuration,
  style,
  children,
}: {
  order?: number;
  rise?: boolean;
  duration?: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.set(
      withDelay(
        reduced ? 0 : order * motionTokens.authEnterStagger,
        withTiming(1, { duration: reduced ? 0 : duration, easing: easeOut }),
      ),
    );
  }, [progress, order, duration, reduced]);
  const animated = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [
      {
        translateY:
          rise && !reduced
            ? (1 - progress.get()) * motionTokens.authEnterRise
            : 0,
      },
    ],
  }));
  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}
