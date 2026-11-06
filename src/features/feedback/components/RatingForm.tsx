import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAnimatedValue } from '@/hooks/useAnimatedValue';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { OriginalStars } from '@/components/receipts/OriginalStars';
import { originalReceipts as o } from '@/design/original-receipts';
import { spacing, useMotion } from '@/design';

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
/** Adapted directly from original components/FeedbackModal.tsx, Epsilon@8f133b0. */
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
  const { t } = useTranslation(),
    motion = useMotion();
  const y = useAnimatedValue(0),
    scale = useAnimatedValue(1),
    opacity = useAnimatedValue(1);
  useEffect(() => {
    if (motion.reduceMotion) return;
    y.setValue(o.feedbackMotion.rise);
    scale.setValue(o.feedbackMotion.scale);
    opacity.setValue(0);
    const native = Platform.OS !== 'web';
    const animation = Animated.parallel([
      Animated.spring(y, {
        toValue: 0,
        useNativeDriver: native,
        damping: o.feedbackMotion.damping,
        stiffness: o.feedbackMotion.stiffness,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: native,
        damping: o.feedbackMotion.damping,
        stiffness: o.feedbackMotion.stiffness,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        useNativeDriver: native,
        duration: o.feedbackMotion.duration,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [motion.reduceMotion, y, scale, opacity]);
  return (
    <Animated.View
      style={[
        styles.form,
        { opacity, transform: [{ translateY: y }, { scale }] },
      ]}
    >
      <Text style={styles.title} accessibilityRole="header">
        {t(
          draft.rating > 3
            ? 'originalReceipts.shareThoughts'
            : 'originalReceipts.reasonTitle',
        )}
      </Text>
      <Text style={styles.dish}>{itemName}</Text>
      <Text style={styles.sub}>{restaurantName}</Text>
      <View style={styles.stars}>
        <OriginalStars
          large
          value={draft.rating}
          onRate={(rating) => onChange({ ...draft, rating })}
          disabled={disabled}
          label={t('feedback.question')}
        />
      </View>
      <View style={styles.options}>
        {reasonCodes.map((code) => {
          const selected = draft.reasonCodes.includes(code);
          return (
            <TouchableOpacity
              key={code}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('feedback.reasons.' + code)}
              accessibilityState={{
                selected,
                disabled:
                  disabled || (!selected && draft.reasonCodes.length >= 3),
              }}
              disabled={
                disabled || (!selected && draft.reasonCodes.length >= 3)
              }
              onPress={() =>
                onChange({
                  ...draft,
                  reasonCodes: selected
                    ? draft.reasonCodes.filter((value) => value !== code)
                    : [...draft.reasonCodes, code],
                })
              }
              style={[styles.option, selected && styles.optionActive]}
            >
              <Text
                style={[styles.optionText, selected && styles.optionTextActive]}
              >
                {t('feedback.reasons.' + code)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <TextInput
        accessibilityLabel={t('feedback.comment')}
        placeholder={t('feedback.comment')}
        placeholderTextColor={o.colors.secondary}
        multiline
        numberOfLines={3}
        maxLength={500}
        allowFontScaling
        maxFontSizeMultiplier={0}
        editable={!disabled}
        value={draft.comment}
        onChangeText={(comment) => onChange({ ...draft, comment })}
        style={styles.input}
      />
      <Text style={styles.counter}>
        {t('feedback.counter', { count: draft.comment.length })}
      </Text>
      <Text style={styles.sub}>{t('feedback.neutralReward')}</Text>
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
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  form: { gap: spacing[16] },
  title: { ...o.type.title, color: o.colors.ink, textAlign: 'center' },
  dish: { ...o.type.product, color: o.colors.ink, textAlign: 'center' },
  sub: { ...o.type.caption, color: o.colors.secondary },
  stars: { alignItems: 'center', marginBottom: spacing[4] },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[8] },
  option: {
    minHeight: o.size.target,
    paddingHorizontal: spacing[16],
    paddingVertical: 10,
    borderRadius: o.radius.chip,
    borderWidth: 1,
    borderColor: o.colors.emptyStar,
    backgroundColor: o.colors.surface,
    justifyContent: 'center',
  },
  optionActive: {
    backgroundColor: o.colors.selected,
    borderColor: o.colors.selected,
  },
  optionText: {
    ...o.type.caption,
    fontWeight: '600',
    color: o.colors.secondary,
  },
  optionTextActive: { color: o.colors.surface },
  input: {
    backgroundColor: o.colors.soft,
    borderWidth: 0,
    borderRadius: o.radius.dish,
    padding: spacing[16],
    fontSize: 14,
    fontWeight: '500',
    color: o.colors.ink,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  counter: { ...o.type.caption, color: o.colors.secondary, textAlign: 'right' },
});
