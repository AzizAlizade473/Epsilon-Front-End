import { decorativeSvgProps } from '@/lib/decorative-svg';
import Star from 'lucide-react-native/icons/star';
import Check from 'lucide-react-native/icons/check';
import { PurchaseArtwork } from '@/components/purchase/PurchaseArtwork';
import { RatingProgress } from '@/components/purchase/RatingProgress';
import { purchaseDesign as p } from '@/design/purchase';
import { Icon } from '@/components/ui/Icon';
import { ReceiptRule } from '@/components/ui/ReceiptRule';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, StyleSheet, View } from 'react-native';
import { useAnimatedValue } from '@/hooks/useAnimatedValue';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PressSurface } from '@/components/ui/PressSurface';
import { Text } from '@/components/ui/Text';
import {
  colors,
  layout,
  motionTokens,
  radius,
  spacing,
  useMotion,
} from '@/design';

export const reasonCodes = [
  'taste',
  'temperature',
  'portion',
  'price',
  'presentation',
  'wait_time',
] as const;
export type RatingDraft = {
  rating: number;
  comment: string;
  reasonCodes: string[];
};
export function RatingForm({
  itemName,
  restaurantName,
  draft,
  onChange,
  onSubmit,
  disabled,
  busy,
  error,
  queued,
  position,
  total,
  ratedCount = 0,
  progressTotal,
}: {
  itemName: string;
  restaurantName: string;
  draft: RatingDraft;
  onChange: (draft: RatingDraft) => void;
  onSubmit: () => void;
  disabled: boolean;
  busy: boolean;
  error?: string;
  queued: boolean;
  position?: number;
  total?: number;
  ratedCount?: number;
  progressTotal?: number;
}) {
  const { t } = useTranslation();
  const motion = useMotion();
  const opacity = useAnimatedValue(1);
  const showReasons = draft.rating > 0 && draft.rating <= 3;
  useEffect(() => {
    if (!showReasons || motion.reduceMotion) {
      opacity.setValue(1);
      return;
    }
    opacity.setValue(0);
    const animation = Animated.timing(opacity, {
      toValue: 1,
      duration: motion.duration.normal,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [showReasons, opacity, motion.reduceMotion, motion.duration.normal]);
  return (
    <View style={styles.form}>
      {position !== undefined && total !== undefined && (
        <Text variant="caption" tone="secondary">
          {t('purchaseDirection.dishPosition', { position, total })}
        </Text>
      )}
      <View style={styles.dishHero}>
        <PurchaseArtwork kind="dish" />
        <View style={styles.dishCopy}>
          <Text variant="caption" tone="secondary">
            {restaurantName}
          </Text>
          <Text accessibilityRole="header" style={[p.headline, styles.ink]}>
            {itemName}
          </Text>
        </View>
      </View>
      {total !== undefined && (
        <RatingProgress done={ratedCount} total={progressTotal ?? total} />
      )}
      <Text variant="title2" style={styles.ink}>
        {t('feedback.question')}
      </Text>
      <View
        style={styles.stars}
        accessibilityRole="radiogroup"
        accessibilityLabel={t('feedback.question')}
      >
        {[1, 2, 3, 4, 5].map((rating) => (
          <PressSurface
            key={rating}
            accessibilityRole="radio"
            accessibilityLabel={t('feedback.starChoice', {
              count: rating,
              meaning: t(`feedback.rating.${rating}`),
            })}
            accessibilityState={{ checked: draft.rating === rating }}
            disabled={disabled}
            contentStyle={[
              styles.starTarget,
              rating <= draft.rating && styles.starSelected,
            ]}
            spring
            pressScale={motionTokens.starPressScale}
            onPress={() =>
              onChange({
                ...draft,
                rating,
                reasonCodes: rating <= 3 ? draft.reasonCodes : [],
              })
            }
          >
            <Star
              size={spacing[32]}
              strokeWidth={layout.iconStrokeWidth}
              color={
                rating <= draft.rating ? colors.surface : colors.brand.primary
              }
              fill={
                rating <= draft.rating ? colors.surface : colors.transparent
              }
              {...decorativeSvgProps}
            />
          </PressSurface>
        ))}
      </View>
      {draft.rating > 0 && (
        <Text accessibilityLiveRegion="polite">
          {t(`feedback.rating.${draft.rating}`)}
        </Text>
      )}
      {showReasons && (
        <Animated.View style={[styles.reasons, { opacity }]}>
          <Text variant="callout" style={styles.reasonHeading}>
            {t('purchaseDirection.reasonTitle')}
          </Text>
          {reasonCodes.map((code) => (
            <PressSurface
              key={code}
              accessibilityLabel={t('feedback.reasons.' + code)}
              accessibilityState={{
                selected: draft.reasonCodes.includes(code),
              }}
              contentStyle={[
                styles.reason,
                draft.reasonCodes.includes(code) && styles.reasonSelected,
              ]}
              disabled={
                disabled ||
                (draft.reasonCodes.length >= 3 &&
                  !draft.reasonCodes.includes(code))
              }
              onPress={() =>
                onChange({
                  ...draft,
                  reasonCodes: draft.reasonCodes.includes(code)
                    ? draft.reasonCodes.filter((value) => value !== code)
                    : [...draft.reasonCodes, code],
                })
              }
            >
              <View
                style={[
                  styles.reasonCheck,
                  draft.reasonCodes.includes(code) && styles.checked,
                ]}
              >
                {draft.reasonCodes.includes(code) && (
                  <Icon
                    icon={Check}
                    size="small"
                    color={colors.surface}
                    decorative
                  />
                )}
              </View>
              <Text variant="callout" style={styles.ink}>
                {t('feedback.reasons.' + code)}
              </Text>
            </PressSurface>
          ))}
        </Animated.View>
      )}
      <ReceiptRule />
      <Input
        label={t('feedback.comment')}
        multiline
        numberOfLines={3}
        maxLength={500}
        editable={!disabled}
        value={draft.comment}
        onChangeText={(comment) => onChange({ ...draft, comment })}
      />
      <Text variant="caption">
        {t('feedback.counter', { count: draft.comment.length })}
      </Text>
      <Text variant="caption">{t('feedback.neutralReward')}</Text>
      {queued && (
        <Text accessibilityLiveRegion="polite">{t('feedback.saved')}</Text>
      )}
      {error && (
        <Text
          tone="danger"
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      )}
      <Button
        label={t(queued ? 'common.retry' : 'feedback.send')}
        loading={busy}
        disabled={draft.rating === 0 || busy}
        onPress={onSubmit}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  dishHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[16],
    paddingVertical: spacing[12],
  },
  dishCopy: { flex: 1, minWidth: 0, gap: spacing[8] },
  ink: { color: colors.brand.primary },
  reasonHeading: {
    width: '100%',
    color: colors.brand.primary,
    paddingBottom: spacing[4],
  },
  reason: {
    flexDirection: 'row',
    gap: spacing[8],
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[12],
    borderWidth: layout.borderWidth,
    borderColor: colors.border,
    borderRadius: radius[12],
  },
  reasonSelected: {
    borderColor: colors.brand.primary,
    backgroundColor: colors.brand.tint,
  },
  reasonCheck: {
    width: spacing[20],
    height: spacing[20],
    borderWidth: layout.borderWidth,
    borderColor: colors.brand.border,
    borderRadius: spacing[4],
  },
  checked: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  form: { gap: spacing[16] },
  stars: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing[8],
    paddingVertical: spacing[12],
  },
  starTarget: {
    flex: 1,
    minWidth: layout.tapTarget,
    minHeight: layout.controlHeight,
    borderRadius: radius[12],
    backgroundColor: colors.brand.tint,
  },
  starSelected: { backgroundColor: colors.brand.primary },
  reasons: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[8] },
});
