import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TextInput, View } from 'react-native';
import FlaskConical from 'lucide-react-native/icons/flask-conical';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { OriginalStars } from '@/components/receipts/OriginalStars';
import { Stars } from '@/components/ratings/Ratings';
import { colors, layout, radius, spacing, typography } from '@/design';
import { saveDemoRating, useDemoRating } from '../demoRatings';

/**
 * Lets people try product feedback without a purchase. Saved only in memory
 * (demoRatings.ts): no API call, no cashback, not counted in product scores.
 */
export function DemoRatingCard({ productId }: { productId: string }) {
  const { t } = useTranslation();
  const saved = useDemoRating(productId);
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const open = editing || !saved;
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Icon
          icon={FlaskConical}
          size="small"
          color={colors.brand.accent}
          decorative
        />
        <Text variant="headline" style={styles.flex}>
          {t('retail.tryTitle')}
        </Text>
      </View>
      <Text variant="caption" style={styles.muted}>
        {t('retail.tryBody')}
      </Text>
      {open ? (
        <>
          <OriginalStars
            value={rating}
            onRate={setRating}
            label={t('retail.tryStars')}
          />
          <TextInput
            value={comment}
            onChangeText={setComment}
            accessibilityLabel={t('feedback.comment')}
            placeholder={t('feedback.comment')}
            placeholderTextColor={colors.inkSecondary}
            multiline
            maxLength={500}
            style={styles.input}
          />
          <Button
            variant="secondary"
            label={t('retail.trySave')}
            disabled={rating === 0}
            onPress={() => {
              saveDemoRating({
                productId,
                rating,
                comment,
                createdAt: new Date().toISOString(),
              });
              setEditing(false);
            }}
          />
        </>
      ) : (
        <View style={styles.saved} accessibilityLiveRegion="polite">
          <Stars value={saved.rating} size="medium" />
          {saved.comment.length > 0 && <Text>{saved.comment}</Text>}
          <Text variant="caption" style={styles.muted}>
            {t('retail.trySaved')}
          </Text>
          <Button
            variant="ghost"
            label={t('retail.tryEdit')}
            onPress={() => {
              setRating(saved.rating);
              setComment(saved.comment);
              setEditing(true);
            }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing[12],
    padding: spacing[16],
    borderRadius: radius[20],
    borderWidth: layout.borderWidth,
    borderColor: colors.brand.border,
    borderStyle: 'dashed',
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing[8] },
  flex: { flex: 1 },
  muted: { color: colors.brand.accent },
  input: {
    ...typography.body,
    minHeight: layout.controlHeight + spacing[24],
    padding: spacing[12],
    borderRadius: radius[16],
    backgroundColor: colors.divider,
    color: colors.ink,
    textAlignVertical: 'top',
  },
  saved: { gap: spacing[8], alignItems: 'flex-start' },
});
