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
import { PurchaseAmount } from '@/components/purchase/PurchaseAmount';
import { PurchaseArtwork } from '@/components/purchase/PurchaseArtwork';
import { purchaseDesign as p } from '@/design/purchase';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { ReceiptRule } from '@/components/ui/ReceiptRule';
import { Brand } from '@/components/ui/Brand';
import { colors, motionTokens, radius, spacing, useMotion } from '@/design';
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
      <View style={styles.top}>
        <Brand />
        <Text variant="caption" tone="secondary">
          {t('navigation.cashback')}
        </Text>
      </View>
      <View style={styles.hero}>
        <Animated.View style={markStyle}>
          <PurchaseArtwork kind="success" />
        </Animated.View>
        <Text
          style={[p.headline, styles.center, styles.ink]}
          accessibilityRole="header"
        >
          {t('feedback.thanks')}
        </Text>
        <Text accessibilityRole="alert" accessibilityLiveRegion="polite">
          {t('feedback.sent')}
        </Text>
        <Text variant="caption" tone="secondary" style={styles.center}>
          {t('purchaseDirection.confirmationNote')}
        </Text>
      </View>
      <View style={styles.ticket}>
        <Text variant="headline" style={styles.ink}>
          {itemName}
        </Text>
        <ReceiptRule />
        {result.reward.status === 'confirmed' &&
          result.reward.amountMinor !== null && (
            <View style={styles.reward}>
              <Text variant="caption" tone="secondary">
                {t('navigation.cashback')}
              </Text>
              <PurchaseAmount minor={result.reward.amountMinor} sign="always" />
              <ReceiptRule />
              <Text style={styles.center}>{t('feedback.rewardConfirmed')}</Text>
            </View>
          )}
        {result.reward.status === 'pending' && (
          <Text style={styles.center}>{t('feedback.rewardPending')}</Text>
        )}
      </View>
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
  content: { flex: 1, gap: spacing[24], justifyContent: 'space-between' },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[12],
  },
  hero: { alignItems: 'center', gap: spacing[12], paddingTop: spacing[16] },
  ink: { color: colors.brand.primary },
  center: { textAlign: 'center' },
  ticket: {
    backgroundColor: colors.brand.tint,
    padding: spacing[24],
    gap: spacing[12],
    borderLeftWidth: spacing[4],
    borderLeftColor: colors.brand.primary,
    borderTopRightRadius: radius[20],
    borderBottomRightRadius: radius[20],
  },
  reward: { gap: spacing[12] },
  actions: { width: '100%', gap: spacing[12] },
});
