import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import BadgeCheck from 'lucide-react-native/icons/badge-check';
import FlaskConical from 'lucide-react-native/icons/flask-conical';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { colors, radius, spacing } from '@/design';
import { formatDate } from '@/lib/date';
import { Stars } from './Ratings';

export type ReviewCardData = {
  rating: number;
  createdAt: string;
  author: string;
  comment: string;
};

/**
 * One review, shared by restaurants and supermarkets. `tagKeys` are full i18n
 * keys. `sample` marks demo content so it is never presented as a verified buyer.
 */
export const ReviewCard = memo(function ReviewCard({
  review,
  tagKeys = [],
  sample = false,
  lines,
}: {
  review: ReviewCardData;
  tagKeys?: readonly string[];
  sample?: boolean;
  lines?: number;
}) {
  const { t, i18n } = useTranslation();
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <Stars value={review.rating} />
        <Text variant="caption" tone="secondary">
          {formatDate(review.createdAt, { locale: i18n.language })}
        </Text>
      </View>
      <Text numberOfLines={lines}>{review.comment}</Text>
      {tagKeys.length > 0 && (
        <View style={styles.aspects}>
          {tagKeys.map((key) => (
            <View key={key} style={styles.aspect}>
              <Text variant="caption" style={styles.aspectText}>
                {t(key)}
              </Text>
            </View>
          ))}
        </View>
      )}
      <View style={styles.author}>
        <Text variant="caption">{review.author}</Text>
        <View style={styles.verified}>
          <Icon
            icon={sample ? FlaskConical : BadgeCheck}
            size="small"
            color={sample ? colors.inkSecondary : colors.successInk}
            decorative
          />
          <Text variant="caption" tone={sample ? 'secondary' : 'success'}>
            {t(sample ? 'retail.sampleReview' : 'dining.verifiedPurchase')}
          </Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    gap: spacing[12],
    padding: spacing[16],
    borderRadius: radius[20],
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing[8],
  },
  aspects: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[8] },
  aspect: {
    paddingHorizontal: spacing[8],
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.tint,
  },
  aspectText: { color: colors.brand.accent },
  author: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing[8],
  },
  verified: { flexDirection: 'row', alignItems: 'center', gap: spacing[4] },
});
