import { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
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
import { formatMoney } from '@/lib/money';

/** A quiet confirmation, shown only for a confirmed server reward. */
export function RewardCelebration({
  amountMinor,
  onDismiss,
}: {
  amountMinor: number;
  onDismiss: () => void;
}) {
  const { t } = useTranslation();
  const motion = useMotion();
  const opacity = useSharedValue(1);
  useEffect(() => {
    const timer = setTimeout(onDismiss, layout.toastDuration);
    return () => clearTimeout(timer);
  }, [onDismiss]);
  useEffect(() => {
    if (Platform.OS !== 'web')
      void notificationAsync(NotificationFeedbackType.Success).catch(
        () => undefined,
      );
  }, []);
  useEffect(() => {
    if (motion.reduceMotion) {
      opacity.value = 1;
      return;
    }
    opacity.value = 0;
    opacity.value = withTiming(1, { duration: motion.duration.normal });
    return () => cancelAnimation(opacity);
  }, [motion.reduceMotion, motion.duration.normal, opacity]);
  const entrance = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View style={[styles.host, entrance]}>
      <View style={styles.banner}>
        <Icon icon={Check} color={colors.brand.primary} decorative />
        <View style={styles.copy}>
          <Text
            variant="caption"
            tone="secondary"
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            accessibilityLabel={
              t('feedback.rewardConfirmed') +
              ' ' +
              formatMoney(amountMinor, { sign: 'always' })
            }
          >
            {t('feedback.rewardConfirmed')}
          </Text>
          <Amount minor={amountMinor} sign="always" variant="title2" />
        </View>
        <IconButton
          icon={X}
          accessibilityLabel={t('navigation.close')}
          onPress={onDismiss}
        />
      </View>
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  host: { position: 'absolute', bottom: spacing[8], left: 0, right: 0 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    padding: spacing[12],
    backgroundColor: colors.surface,
    borderWidth: layout.borderWidth,
    borderColor: colors.border,
    borderRadius: radius[12],
    minHeight: layout.detailRowHeight,
  },
  copy: { flex: 1, minWidth: 0, gap: spacing[4] },
});
