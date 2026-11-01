import { decorativeSvgProps } from '@/lib/decorative-svg';
import Star from 'lucide-react-native/icons/star';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, StyleSheet, View } from 'react-native';
import { useAnimatedValue } from '@/hooks/useAnimatedValue';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { PressSurface } from '@/components/ui/PressSurface';
import { Text } from '@/components/ui/Text';
import { colors, layout, motionTokens, spacing, useMotion } from '@/design';

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
      <Text variant="title2" accessibilityRole="header">
        {itemName}
      </Text>
      <Text variant="caption">{restaurantName}</Text>
      <Text>{t('feedback.question')}</Text>
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
            contentStyle={styles.starTarget}
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
              size={layout.ratingStarSize}
              strokeWidth={layout.iconStrokeWidth}
              color={
                rating <= draft.rating
                  ? colors.brand.primary
                  : colors.inkSecondary
              }
              fill={
                rating <= draft.rating
                  ? colors.brand.primary
                  : colors.transparent
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
          {reasonCodes.map((code) => (
            <Chip
              key={code}
              label={t(`feedback.reasons.${code}`)}
              selected={draft.reasonCodes.includes(code)}
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
            />
          ))}
        </Animated.View>
      )}
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
  form: { gap: spacing[16] },
  stars: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing[4],
  },
  starTarget: {
    minWidth: layout.controlHeight,
    minHeight: layout.controlHeight,
  },
  reasons: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[8] },
});
