import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { colors, layout, motionTokens, spacing } from '@/design';
import { decorativeSvgProps } from '@/lib/decorative-svg';
import { contourPaths } from './contour';
import { easeOut } from './entrance';

// White sheet edge: high on the left, a soft dip toward the right, like the reference.
const wave =
  'M0 22 C70 2 140 0 196 16 S292 60 330 54 S360 40 360 36 L360 56 L0 56 Z';

/** Navy topographic header that melts into the white sheet below. */
export function WaveHeader({
  height,
  progress,
  children,
}: {
  height: number;
  /** 0..1 pager progress; drives a slow parallax drift of the contours. */
  progress?: SharedValue<number>;
  children?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState<number>(layout.designWidth);
  const total = height + insets.top;
  const paths = useMemo(
    () => contourPaths(width + layout.contourParallax, total),
    [width, total],
  );
  const reduced = useReducedMotion();
  const reveal = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    reveal.set(
      withTiming(1, {
        duration: reduced ? 0 : motionTokens.contourFadeDuration,
        easing: easeOut,
      }),
    );
  }, [reveal, reduced]);
  const drift = useAnimatedStyle(() => ({
    opacity: reveal.get(),
    transform: [
      {
        translateX:
          progress && !reduced
            ? interpolate(
                progress.get(),
                [0, 1],
                [0, -layout.contourParallax],
                Extrapolation.CLAMP,
              )
            : 0,
      },
    ],
  }));
  return (
    <View
      style={[styles.root, { height: total, paddingTop: insets.top }]}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      <StatusBar style="light" />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.pattern,
          { width: width + layout.contourParallax, height: total },
          drift,
        ]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Svg
          width="100%"
          height="100%"
          strokeWidth={layout.borderWidth}
          {...decorativeSvgProps}
        >
          {paths.map((d, index) => (
            <Path
              key={index}
              d={d}
              fill="none"
              stroke={colors.brand.onDeep}
              strokeOpacity={layout.contourOpacity}
            />
          ))}
        </Svg>
      </Animated.View>
      <View style={styles.content}>{children}</View>
      <Svg
        style={styles.wave}
        width="100%"
        height={layout.authWaveHeight}
        viewBox={`0 0 360 ${layout.authWaveHeight}`}
        preserveAspectRatio="none"
        {...decorativeSvgProps}
      >
        <Path d={wave} fill={colors.surface} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.brand.deep,
    overflow: 'hidden',
  },
  pattern: { position: 'absolute', top: 0, left: 0 },
  content: {
    flex: 1,
    paddingHorizontal: spacing.screenMargin,
    paddingTop: spacing[12],
    paddingBottom: layout.authWaveHeight,
  },
  wave: { position: 'absolute', left: 0, right: 0, bottom: -1 },
});
