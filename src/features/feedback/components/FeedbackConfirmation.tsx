import Check from 'lucide-react-native/icons/check';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {
  AndroidHaptics,
  NotificationFeedbackType,
  notificationAsync,
  performAndroidHapticsAsync,
} from 'expo-haptics';
import { Amount } from '@/components/ui/Amount';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { ReceiptRule } from '@/components/ui/ReceiptRule';
import { Brand } from '@/components/ui/Brand';
import {
  colors,
  layout,
  motionTokens,
  radius,
  spacing,
  useMotion,
} from '@/design';
import type { FeedbackResult } from '@/services/contracts';

export function FeedbackConfirmation({
  result,
  itemName,
  remaining,
  onReceipt,
  onHome,
}: {
  result: FeedbackResult;
  itemName: string;
  remaining: boolean;
  onReceipt: () => void;
  onHome: () => void;
}) {
  const { t } = useTranslation();
  const motion = useMotion();
  const scale = useSharedValue(1);
  const markStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));
  useEffect(() => {
    const haptic =
      Platform.OS === 'android'
        ? performAndroidHapticsAsync(AndroidHaptics.Confirm)
        : notificationAsync(NotificationFeedbackType.Success);
    void haptic.catch(() => undefined);
  }, []);
  useEffect(() => {
    scale.set(motion.reduceMotion ? 1 : motionTokens.feedbackSuccessScale);
    if (!motion.reduceMotion)
      scale.set(
        withSpring(1, {
          duration: motionTokens.feedbackSuccessDuration,
          dampingRatio: 0.8,
        }),
      );
    return () => cancelAnimation(scale);
  }, [motion.reduceMotion, scale]);
  return (
    <View style={styles.content}>
      <Brand />
      <Animated.View style={[styles.mark, markStyle]}>
        <Icon icon={Check} size="large" decorative color={colors.surface} />
      </Animated.View>
      <Text variant="title1" style={styles.center} accessibilityRole="header">
        {t('feedback.thanks')}
      </Text>
      <Text accessibilityRole="alert" accessibilityLiveRegion="polite">
        {t('feedback.sent')}
      </Text>
      <Text>{itemName}</Text>
      {result.reward.status === 'confirmed' &&
        result.reward.amountMinor !== null && (
          <View style={styles.reward}>
            <Text variant="caption" tone="secondary">
              {t('navigation.cashback')}
            </Text>
            <Amount
              minor={result.reward.amountMinor}
              sign="always"
              variant="title1"
              tone="success"
            />
            <ReceiptRule />
            <Text style={styles.center}>{t('feedback.rewardConfirmed')}</Text>
          </View>
        )}
      {result.reward.status === 'pending' && (
        <Text style={styles.center}>{t('feedback.rewardPending')}</Text>
      )}
      <View style={styles.actions}>
        {remaining && (
          <Button label={t('feedback.otherDish')} onPress={onReceipt} />
        )}
        <Button
          variant={remaining ? 'ghost' : 'primary'}
          label={t('feedback.home')}
          onPress={onHome}
        />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[20],
  },
  mark: {
    width: layout.successMarkSize,
    height: layout.successMarkSize,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { textAlign: 'center' },
  reward: {
    alignItems: 'center',
    gap: spacing[8],
    backgroundColor: colors.surface,
    borderRadius: radius[24],
    padding: spacing[24],
    width: '100%',
    borderWidth: layout.borderWidth,
    borderColor: colors.border,
  },
  actions: { width: '100%', gap: spacing[12] },
});
