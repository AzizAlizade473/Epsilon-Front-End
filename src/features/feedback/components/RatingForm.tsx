import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { colors, spacing } from '@/design';
import { originalReceipts as o } from '@/design/original-receipts';
import {
  commentsFor,
  legacyReasonCodes,
  reasonLabelKey,
} from '@/lib/quick-comments';
import { RatingStars } from './RatingStars';

export type RatingDraft = {
  rating: number;
  comment: string;
  reasonCodes: string[];
};

const reveal = FadeIn.duration(220).reduceMotion(ReduceMotion.System);
const MAX_COMMENTS = 6;

/** Keeps codes that still fit `rating` (its quick comments, or legacy codes from older reviews). */
export const fittingCodes = (codes: readonly string[], rating: number) =>
  codes.filter(
    (code) =>
      commentsFor(rating).includes(code) ||
      (legacyReasonCodes as readonly string[]).includes(code),
  );

/**
 * The focused question for one dish: stars first, then (only once a rating is
 * chosen) optional reasons and a note. A rating alone is enough to send.
 */
export function RatingForm({
  itemName,
  draft,
  onChange,
  onSubmit,
  onSkip,
  disabled,
  busy,
  error,
  queued,
  editing = false,
}: {
  /** Changing an existing review: its own title and button. */
  editing?: boolean;
  itemName: string;
  draft: RatingDraft;
  onChange: (draft: RatingDraft) => void;
  onSubmit: () => void;
  onSkip?: () => void;
  disabled: boolean;
  busy: boolean;
  error?: string;
  queued: boolean;
}) {
  const { t } = useTranslation();
  const rated = draft.rating > 0;
  // Picks that no longer fit a changed rating are dropped, and the customer is told.
  const [cleared, setCleared] = useState(false);
  const rate = (rating: number) => {
    const kept = fittingCodes(draft.reasonCodes, rating);
    setCleared(kept.length < draft.reasonCodes.length);
    onChange({ ...draft, rating, reasonCodes: kept });
  };
  const choices = [
    ...commentsFor(draft.rating),
    ...draft.reasonCodes.filter(
      (code) => !commentsFor(draft.rating).includes(code),
    ),
  ];
  return (
    <View style={styles.form}>
      <View style={styles.ask}>
        <Text style={styles.eyebrow}>
          {t(editing ? 'rate.editEyebrow' : 'rate.eyebrow')}
        </Text>
        <Text style={styles.question} accessibilityRole="header">
          {t('rate.question', { dish: itemName })}
        </Text>
        <Text style={styles.sub}>
          {t(editing ? 'rate.editSub' : 'rate.sub')}
        </Text>
      </View>
      <RatingStars value={draft.rating} disabled={disabled} onRate={rate} />
      <Text
        style={[styles.label, !rated && styles.hidden]}
        accessibilityLiveRegion="polite"
      >
        {rated ? t(`rate.label.${draft.rating}`) : ' '}
      </Text>
      {rated && (
        <Animated.View entering={reveal} style={styles.detail}>
          <Text style={styles.detailTitle}>
            {t(`rate.ask.${draft.rating}`)}
          </Text>
          {cleared && (
            <Text style={styles.note} accessibilityLiveRegion="polite">
              {t('rate.cleared')}
            </Text>
          )}
          <Animated.View
            key={draft.rating}
            entering={reveal}
            style={styles.options}
          >
            {choices.map((code) => {
              const selected = draft.reasonCodes.includes(code);
              const full =
                !selected && draft.reasonCodes.length >= MAX_COMMENTS;
              return (
                <Pressable
                  key={code}
                  accessibilityRole="button"
                  accessibilityLabel={t(reasonLabelKey(code))}
                  accessibilityState={{ selected, disabled: disabled || full }}
                  disabled={disabled || full}
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
                    style={[
                      styles.optionText,
                      selected && styles.optionTextActive,
                    ]}
                  >
                    {t(reasonLabelKey(code))}
                  </Text>
                </Pressable>
              );
            })}
          </Animated.View>
          <TextInput
            accessibilityLabel={t('feedback.comment')}
            placeholder={t('rate.comment')}
            placeholderTextColor={o.colors.secondary}
            multiline
            maxLength={500}
            editable={!disabled}
            value={draft.comment}
            onChangeText={(comment) => onChange({ ...draft, comment })}
            style={styles.input}
          />
        </Animated.View>
      )}
      {queued && (
        <Text style={styles.sub} accessibilityLiveRegion="polite">
          {t('feedback.saved')}
        </Text>
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
        label={t(
          queued ? 'common.retry' : editing ? 'rate.save' : 'feedback.send',
        )}
        loading={busy}
        disabled={!rated || busy}
        onPress={onSubmit}
      />
      <Text style={[styles.sub, styles.center]}>{t('rate.welcome')}</Text>
      {onSkip && (
        <Pressable
          accessibilityRole="button"
          onPress={onSkip}
          disabled={busy}
          style={styles.skip}
        >
          <Text style={styles.skipText}>{t('rate.skip')}</Text>
        </Pressable>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  form: { gap: spacing[16] },
  ask: { gap: spacing[4], alignItems: 'center' },
  eyebrow: {
    ...o.type.caption,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: o.colors.secondary,
  },
  question: {
    ...o.type.title,
    fontSize: 22,
    lineHeight: 28,
    color: o.colors.ink,
    textAlign: 'center',
  },
  sub: { ...o.type.caption, color: o.colors.secondary, textAlign: 'center' },
  center: { textAlign: 'center' },
  label: {
    ...o.type.product,
    fontSize: 16,
    color: colors.brand.primary,
    textAlign: 'center',
    marginTop: -spacing[8],
  },
  hidden: { opacity: 0 },
  detail: { gap: spacing[12] },
  detailTitle: { ...o.type.product, color: o.colors.ink },
  note: { ...o.type.caption, color: o.colors.secondary },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[8] },
  option: {
    minHeight: o.size.target,
    paddingHorizontal: spacing[16],
    borderRadius: o.radius.chip,
    borderWidth: 1,
    borderColor: o.colors.emptyStar,
    backgroundColor: o.colors.surface,
    justifyContent: 'center',
  },
  optionActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  optionText: { ...o.type.caption, fontWeight: '600', color: o.colors.ink },
  optionTextActive: { color: o.colors.surface },
  input: {
    minHeight: 88,
    backgroundColor: o.colors.soft,
    borderRadius: o.radius.dish,
    padding: spacing[16],
    textAlignVertical: 'top',
    color: o.colors.ink,
    ...o.type.caption,
  },
  skip: {
    minHeight: o.size.target,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    ...o.type.caption,
    fontWeight: '600',
    color: colors.brand.primary,
  },
});
