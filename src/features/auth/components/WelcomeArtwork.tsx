import { useEffect } from 'react';
import { Animated, Platform, StyleSheet } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { colors, layout, motionTokens, useMotion } from '@/design';
import { useAnimatedValue } from '@/hooks/useAnimatedValue';
import { decorativeSvgProps } from '@/lib/decorative-svg';

/** Receipt, purchased-dish feedback and verification: decorative, not live data. */
export function WelcomeArtwork() {
  const progress = useAnimatedValue(1);
  const motion = useMotion();
  useEffect(() => {
    if (motion.reduceMotion) {
      progress.setValue(1);
      return;
    }
    progress.setValue(0);
    const entrance = Animated.timing(progress, {
      toValue: 1,
      duration: motionTokens.welcomeIntroDuration,
      easing: motion.easing,
      useNativeDriver: Platform.OS !== 'web',
    });
    entrance.start();
    return () => entrance.stop();
  }, [progress, motion.reduceMotion, motion.easing]);
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.art,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [layout.welcomeArtRise, 0],
              }),
            },
            {
              rotate: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [motionTokens.welcomeIntroRotation, '0deg'],
              }),
            },
          ],
        },
      ]}
    >
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 240 144"
        {...decorativeSvgProps}
      >
        <G
          strokeWidth={layout.iconStrokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Path
            d="M82 12H158V126L150 120L142 126L134 120L126 126L118 120L110 126L102 120L94 126L82 120Z"
            fill={colors.surface}
            stroke={colors.brand.primary}
          />
          <Path
            d="M96 36H144M96 50H136M96 64H144"
            stroke={colors.brand.border}
          />
          <G fill={colors.brand.primary}>
            <Path d="m101 80 2 4 5 1-4 3 1 5-4-3-4 3 1-5-4-3 5-1Z" />
            <Path d="m120 80 2 4 5 1-4 3 1 5-4-3-4 3 1-5-4-3 5-1Z" />
            <Path d="m139 80 2 4 5 1-4 3 1 5-4-3-4 3 1-5-4-3 5-1Z" />
          </G>
          <Circle cx="171" cy="107" r="18" fill={colors.brand.primary} />
          <Path d="m163 107 5 5 11-12" fill="none" stroke={colors.surface} />
          <Path
            d="M55 49H43V61M43 78V90H55M185 33H197V45"
            fill="none"
            stroke={colors.brand.border}
          />
        </G>
      </Svg>
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  art: {
    width: '100%',
    maxWidth: layout.welcomeArtWidth,
    height: layout.welcomeArtHeight,
    alignSelf: 'center',
  },
});
