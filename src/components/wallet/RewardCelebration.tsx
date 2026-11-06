import { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { notificationAsync, NotificationFeedbackType } from 'expo-haptics';
import Check from 'lucide-react-native/icons/check';
import X from 'lucide-react-native/icons/x';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { Amount } from '@/components/ui/Amount';
import { colors, layout, radius, spacing, useMotion } from '@/design';
import { walletDesign as w } from '@/design/wallet';
import { formatMoney } from '@/lib/money';

/** Only mounted for an actual confirmed server reward; never estimates earnings. */
export function RewardCelebration({
  amountMinor,
  onDismiss,
}: {
  amountMinor: number;
  onDismiss: () => void;
}) {
  const { t } = useTranslation();
  const motion = useMotion();
  const bloom = useSharedValue(1);
  const content = useSharedValue(1);
  useEffect(() => {
    const timer = setTimeout(onDismiss, layout.toastDuration);
    return () => clearTimeout(timer);
  }, [onDismiss]);
  useEffect(() => {
    if (motion.reduceMotion) {
      bloom.value = 1;
      content.value = 1;
      return;
    }
    bloom.value = 0;
    content.value = 0;
    bloom.value = withSpring(1, w.spring);
    content.value = withDelay(
      w.stagger * 3,
      withTiming(1, { duration: w.successDuration }),
    );
    if (Platform.OS !== 'web')
      void notificationAsync(NotificationFeedbackType.Success).catch(
        () => undefined,
      );
    return () => {
      cancelAnimation(bloom);
      cancelAnimation(content);
    };
  }, [bloom, content, motion.reduceMotion]);
  const circle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(bloom.value, [0, 0.7, 1], [0.1, 1.3, 1]) },
    ],
  }));
  const copy = useAnimatedStyle(() => ({
    opacity: content.value,
    transform: [{ translateY: w.rise * (1 - content.value) }],
  }));
  return (
    <View style={styles.host}>
      <View style={styles.banner}>
        <Animated.View pointerEvents="none" style={[styles.orb, circle]}>
          <Icon icon={Check} color={colors.surface} decorative size="large" />
        </Animated.View>
        <Animated.View style={[styles.copy, copy]}>
          <Text
            variant="caption"
            tone="inverse"
            accessibilityRole="alert"
            accessibilityLabel={
              t('feedback.rewardConfirmed') +
              ' ' +
              formatMoney(amountMinor, { sign: 'always' })
            }
            accessibilityLiveRegion="polite"
          >
            {t('feedback.rewardConfirmed')}
          </Text>
          <Amount
            minor={amountMinor}
            sign="always"
            variant="title2"
            tone="inverse"
          />
        </Animated.View>
        <IconButton
          icon={X}
          tone="inverse"
          accessibilityLabel={t('navigation.close')}
          onPress={onDismiss}
        />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  host: { position: 'absolute', bottom: spacing[8], left: 0, right: 0 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[16],
    padding: spacing[16],
    backgroundColor: w.colors.canvas,
    borderRadius: radius[24],
    overflow: 'hidden',
    minHeight: w.successSize + spacing[16],
  },
  orb: {
    width: layout.controlHeight,
    height: layout.controlHeight,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, minWidth: 0, gap: spacing[4] },
});
