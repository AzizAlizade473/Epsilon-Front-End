import { useEffect } from 'react';
import { Animated, StyleSheet, View, useAnimatedValue } from 'react-native';
import Check from 'lucide-react-native/icons/check';
import { Icon } from '@/components/ui/Icon';
import { colors, layout, motionTokens, spacing, useMotion } from '@/design';

export function Viewfinder({
  success,
  scanning,
}: {
  success: boolean;
  scanning: boolean;
}) {
  const motion = useMotion();
  const line = useAnimatedValue(0);
  const checkScale = useAnimatedValue(1);
  useEffect(() => {
    if (!success || motion.reduceMotion) {
      checkScale.setValue(1);
      return;
    }
    checkScale.setValue(motionTokens.feedbackSuccessScale);
    const animation = Animated.spring(checkScale, {
      toValue: 1,
      ...motionTokens.spring,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [success, motion.reduceMotion, checkScale]);
  useEffect(() => {
    if (motion.reduceMotion || !scanning) return;
    line.setValue(0);
    const animation = Animated.loop(
      Animated.sequence(
        [1, 0].map((toValue) =>
          Animated.timing(line, {
            toValue,
            duration: motionTokens.scanLineDuration / 2,
            useNativeDriver: true,
          }),
        ),
      ),
    );
    animation.start();
    return () => animation.stop();
  }, [motion.reduceMotion, scanning, line]);
  const borderColor = success ? colors.success : colors.surface;
  return (
    <View
      style={styles.fill}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={styles.mask} />
      <View style={styles.middle}>
        <View style={styles.mask} />
        <View style={styles.window}>
          <View style={[styles.corner, styles.tl, { borderColor }]} />
          <View style={[styles.corner, styles.tr, { borderColor }]} />
          <View style={[styles.corner, styles.bl, { borderColor }]} />
          <View style={[styles.corner, styles.br, { borderColor }]} />
          {scanning && !motion.reduceMotion && (
            <Animated.View
              style={[
                styles.line,
                {
                  transform: [
                    {
                      translateY: line.interpolate({
                        inputRange: [0, 1],
                        outputRange: [
                          spacing[8],
                          layout.scanViewfinderSize - spacing[8],
                        ],
                      }),
                    },
                  ],
                },
              ]}
            />
          )}
          {success && (
            <Animated.View style={{ transform: [{ scale: checkScale }] }}>
              <Icon
                icon={Check}
                size="large"
                color={colors.surface}
                decorative
              />
            </Animated.View>
          )}
        </View>
        <View style={styles.mask} />
      </View>
      <View style={styles.mask} />
    </View>
  );
}
const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFill, flex: 1 },
  mask: { flex: 1, backgroundColor: colors.scanDim },
  middle: { flexDirection: 'row', height: layout.scanViewfinderSize },
  window: {
    width: layout.scanViewfinderSize,
    height: layout.scanViewfinderSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: { position: 'absolute', width: spacing[32], height: spacing[32] },
  tl: {
    top: 0,
    left: 0,
    borderTopWidth: layout.scanBracketWidth,
    borderLeftWidth: layout.scanBracketWidth,
  },
  tr: {
    top: 0,
    right: 0,
    borderTopWidth: layout.scanBracketWidth,
    borderRightWidth: layout.scanBracketWidth,
  },
  bl: {
    bottom: 0,
    left: 0,
    borderBottomWidth: layout.scanBracketWidth,
    borderLeftWidth: layout.scanBracketWidth,
  },
  br: {
    bottom: 0,
    right: 0,
    borderBottomWidth: layout.scanBracketWidth,
    borderRightWidth: layout.scanBracketWidth,
  },
  line: {
    position: 'absolute',
    top: 0,
    left: spacing[8],
    right: spacing[8],
    height: layout.scanLineWidth,
    backgroundColor: colors.brand.primary,
  },
});
