import { StatusBar } from 'expo-status-bar';
import { memo, useEffect, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Defs,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { colors, layout, motionTokens, spacing } from '@/design';
import { decorativeSvgProps } from '@/lib/decorative-svg';
import { contourLayers } from './contour';
import { easeOut } from './Rise';

// White sheet edge: high on the left, a soft dip toward the right, like the reference.
const wave =
  'M0 22 C70 2 140 0 196 16 S292 60 330 54 S360 40 360 36 L360 58 L0 58 Z';
/** One Epsilon blue per onboarding page; white text stays above 4.5:1 on each. */
const palette = [
  colors.brand.deep,
  colors.brand.secondary,
  colors.brand.accent,
];
/** Far rings drift least, near rings most: reads as depth, not a flat slide. */
const depths = [0.5, 1, 1.6] as const;
const maxShift = layout.contourParallax * depths[2];

/** Topographic brand header that melts into the white sheet below. */
export function WaveHeader({
  height,
  progress,
  children,
}: {
  height: number;
  /** 0..1 pager progress; drives colour, glow and contour depth. */
  progress?: SharedValue<number>;
  children?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState<number>(layout.designWidth);
  // Whole pixels: a fractional edge anti-aliases into a grey seam under the wave.
  const total = Math.round(height + insets.top);
  return (
    <View
      style={[styles.root, { height: total, paddingTop: insets.top }]}
      onLayout={(event) => setWidth(Math.round(event.nativeEvent.layout.width))}
    >
      <StatusBar style="light" />
      <Backdrop width={width} total={total} progress={progress} />
      <View style={styles.content}>{children}</View>
      <Svg
        style={styles.wave}
        width="100%"
        height={layout.authWaveHeight + 2}
        viewBox={`0 0 360 ${layout.authWaveHeight + 2}`}
        preserveAspectRatio="none"
        {...decorativeSvgProps}
      >
        <Path d={wave} fill={colors.surface} />
      </Svg>
    </View>
  );
}

/** All decoration in one memoized subtree; only shared values move it. */
const Backdrop = memo(function Backdrop({
  width,
  total,
  progress,
}: {
  width: number;
  total: number;
  progress?: SharedValue<number>;
}) {
  const layers = useMemo(
    () => contourLayers(width + maxShift, total),
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
  const tint = useAnimatedStyle(() => ({
    backgroundColor: progress
      ? interpolateColor(progress.get(), [0, 0.5, 1], palette)
      : colors.brand.deep,
  }));
  const glow = useAnimatedStyle(() => ({
    transform: [
      {
        translateX:
          progress && !reduced
            ? interpolate(progress.get(), [0, 1], [0, -width * 0.6])
            : 0,
      },
    ],
  }));
  return (
    <View
      style={styles.clip}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View style={[StyleSheet.absoluteFill, tint]} />
      <Svg
        style={StyleSheet.absoluteFill}
        width="100%"
        height="100%"
        {...decorativeSvgProps}
      >
        <Defs>
          <LinearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
            <Stop
              offset="0"
              stopColor={colors.brand.primaryPressed}
              stopOpacity={0.35}
            />
            <Stop
              offset="0.6"
              stopColor={colors.brand.primaryPressed}
              stopOpacity={0}
            />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#shade)" />
      </Svg>
      <Animated.View
        style={[styles.layer, { width: width * 1.6, height: total }, glow]}
      >
        <Svg width="100%" height="100%" {...decorativeSvgProps}>
          <Defs>
            <RadialGradient id="glow" cx="72%" cy="38%" r="45%">
              <Stop
                offset="0"
                stopColor={colors.brand.onDeep}
                stopOpacity={0.28}
              />
              <Stop
                offset="1"
                stopColor={colors.brand.onDeep}
                stopOpacity={0}
              />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#glow)" />
        </Svg>
      </Animated.View>
      {layers.map((paths, index) => (
        <ContourLayer
          key={index}
          paths={paths}
          depth={depths[index] ?? 1}
          width={width + maxShift}
          height={total}
          progress={progress}
          reveal={reveal}
          reduced={reduced}
        />
      ))}
    </View>
  );
});

// Memoized: page changes re-render the screen, but these SVGs never need to.
const ContourLayer = memo(function ContourLayer({
  paths,
  depth,
  width,
  height,
  progress,
  reveal,
  reduced,
}: {
  paths: string[];
  depth: number;
  width: number;
  height: number;
  progress?: SharedValue<number>;
  reveal: SharedValue<number>;
  reduced: boolean;
}) {
  const style = useAnimatedStyle(() => {
    const p = progress && !reduced ? progress.get() : 0;
    return {
      opacity: reveal.get(),
      transform: [
        {
          translateX: interpolate(
            p,
            [0, 1],
            [0, -layout.contourParallax * depth],
            Extrapolation.CLAMP,
          ),
        },
        // Rings swell slightly between pages, then settle: a breath, not a slide.
        { translateY: interpolate(p, [0, 0.5, 1], [0, -6 * depth, 0]) },
        { scale: interpolate(p, [0, 0.5, 1], [1, 1 + 0.03 * depth, 1]) },
      ],
    };
  });
  return (
    <Animated.View style={[styles.layer, { width, height }, style]}>
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
  );
});

const styles = StyleSheet.create({
  root: { backgroundColor: colors.brand.deep },
  clip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  layer: { position: 'absolute', top: 0, left: 0 },
  content: {
    flex: 1,
    zIndex: 1,
    paddingHorizontal: spacing.screenMargin,
    paddingTop: spacing[12],
    paddingBottom: layout.authWaveHeight,
  },
  wave: { position: 'absolute', left: 0, right: 0, bottom: -2 },
});
