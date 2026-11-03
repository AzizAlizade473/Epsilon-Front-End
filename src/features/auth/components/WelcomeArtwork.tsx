import { useEffect } from 'react';
import { Animated, Platform, StyleSheet } from 'react-native';
import { ReceiptArtwork } from '@/components/ui/ReceiptArtwork';
import { layout, motionTokens, useMotion } from '@/design';
import { useAnimatedValue } from '@/hooks/useAnimatedValue';

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
      <ReceiptArtwork />
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
