import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  ReduceMotion,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { colors, spacing, useMotion } from '@/design';

const mark = require('../../../../assets/brand/logo-mark-white.png');
const MARK = 72;
const CYCLE = 1600;

export type ProcessingStep = 'receiving' | 'reading' | 'finding' | 'ready';

/**
 * Shown only while the app itself works on the downloaded receipt (never over
 * the official page). The Epsilon mark breathes and a halo pulses out on a
 * seamless loop; the line below follows the real pipeline step. No percentage:
 * nothing here can measure one honestly.
 */
export function ReceiptProcessing({
  step,
  onCancel,
}: {
  step: ProcessingStep;
  onCancel?: () => void;
}) {
  const { t } = useTranslation();
  const { reduceMotion } = useMotion();
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion) return;
    pulse.set(
      withRepeat(
        withTiming(1, { duration: CYCLE, easing: Easing.inOut(Easing.sin) }),
        -1,
        false,
        undefined,
        ReduceMotion.System,
      ),
    );
    return () => cancelAnimation(pulse);
  }, [pulse, reduceMotion]);
  const breathe = useAnimatedStyle(() => {
    const p = pulse.get();
    // 0 → 1 → 0 across one cycle: in and out without a jump at the seam.
    const wave = Math.sin(p * Math.PI);
    return { transform: [{ scale: 0.96 + wave * 0.06 }] };
  });
  const halo = useAnimatedStyle(() => {
    const p = pulse.get();
    return { opacity: 0.35 * (1 - p), transform: [{ scale: 1 + p * 0.6 }] };
  });
  return (
    <View style={styles.root} accessibilityLiveRegion="polite">
      <View style={styles.stage}>
        {!reduceMotion && <Animated.View style={[styles.halo, halo]} />}
        <Animated.View style={[styles.disc, breathe]}>
          <Image
            source={mark}
            style={styles.mark}
            contentFit="contain"
            accessible={false}
          />
        </Animated.View>
      </View>
      <Text variant="title2" accessibilityRole="header" style={styles.center}>
        {t('processing.title')}
      </Text>
      <Animated.View
        key={step}
        entering={FadeIn.duration(220).reduceMotion(ReduceMotion.System)}
        exiting={FadeOut.duration(120).reduceMotion(ReduceMotion.System)}
      >
        <Text tone="secondary" style={styles.center}>
          {t(`processing.step.${step}`)}
        </Text>
      </Animated.View>
      {onCancel && step !== 'ready' && (
        <Button variant="ghost" label={t('common.cancel')} onPress={onCancel} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[12],
    padding: spacing.screenMargin,
    backgroundColor: colors.surface,
  },
  stage: {
    width: MARK * 2,
    height: MARK * 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[8],
  },
  halo: {
    position: 'absolute',
    width: MARK * 1.4,
    height: MARK * 1.4,
    borderRadius: MARK,
    backgroundColor: colors.brand.secondary,
  },
  disc: {
    width: MARK * 1.4,
    height: MARK * 1.4,
    borderRadius: MARK,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.primary,
  },
  mark: { width: MARK * (296 / 242) * 0.75, height: MARK * 0.75 },
  center: { textAlign: 'center' },
});
