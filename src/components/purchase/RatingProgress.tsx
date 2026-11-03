import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { colors, spacing } from '@/design';
import { purchaseDesign as p } from '@/design/purchase';

export function RatingProgress({
  done,
  total,
}: {
  done: number;
  total: number;
}) {
  const { t } = useTranslation();
  const progress = total > 0 ? Math.min(1, Math.max(0, done / total)) : 0;
  return (
    <View style={styles.group}>
      <View style={styles.copy}>
        <Text variant="caption" tone="secondary">
          {t('purchaseDirection.ratingProgress')}
        </Text>
        <Text variant="caption">
          {t('purchaseDirection.progress', { done, total })}
        </Text>
      </View>
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={t('purchaseDirection.ratingProgress')}
        accessibilityValue={{ min: 0, max: total, now: done }}
        style={styles.track}
      >
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  group: { gap: spacing[12] },
  copy: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[12],
  },
  track: { height: p.progressHeight, backgroundColor: colors.brand.border },
  fill: { height: '100%', backgroundColor: colors.brand.primary },
});
