import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import ArrowUpRight from 'lucide-react-native/icons/arrow-up-right';
import { PressSurface } from '@/components/ui/PressSurface';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { DetailRowSkeleton } from '@/components/feedback/DetailRowSkeleton';
import { FoodImage } from '@/components/food/FoodImage';
import { useReceiptLibrary } from '@/hooks/useReceiptLibrary';
import { useFeedback } from '@/providers/FeedbackProvider';
import { colors, radius, spacing } from '@/design';
import { premium } from '@/design/premium';

/** Only actual verified purchased items can appear here. Opens the bill first. */
export function WaitingDishes({
  receiptIds,
  embedded = false,
}: {
  receiptIds: readonly (string | null | undefined)[];
  /** Inside Home's combined section: the parent owns the heading. */
  embedded?: boolean;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const library = useReceiptLibrary(receiptIds);
  const feedback = useFeedback();
  const blocked = new Set([
    ...feedback.completedIds,
    ...feedback.entries.map((e) => e.receiptItemId),
  ]);
  const waiting = library.receipts
    .flatMap((receipt) =>
      receipt.status !== 'verified'
        ? []
        : receipt.items
            .filter(
              (item) =>
                item.canRate && item.rating === null && !blocked.has(item.id),
            )
            .map((item) => ({ receipt, item })),
    )
    .slice(0, 6);
  const purchased = library.receipts
    .filter((receipt) => receipt.status === 'verified')
    .flatMap((receipt) =>
      receipt.items.filter((item) => item.canRate || item.rating !== null),
    );
  const rated = purchased.filter(
    (item) => item.rating !== null || feedback.completedIds.includes(item.id),
  ).length;
  return (
    <View style={styles.section}>
      {!embedded && (
        <>
          <View style={styles.heading}>
            <Text variant="title2" accessibilityRole="header">
              {t('premium.waiting')}
            </Text>
            {waiting.length > 0 && (
              <View style={styles.count}>
                <Text variant="caption" style={styles.accent}>
                  {waiting.length}
                </Text>
              </View>
            )}
          </View>
          <Text variant="caption" tone="secondary">
            {t('homeFocus.instructions')}
          </Text>
        </>
      )}
      {purchased.length > 0 && (
        <View style={styles.progressBlock}>
          <Text variant="caption" tone="secondary">
            {t('homeFocus.progress', { done: rated, total: purchased.length })}
          </Text>
          <View
            style={styles.track}
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={t('premium.waiting')}
            accessibilityValue={{ min: 0, max: purchased.length, now: rated }}
          >
            <View
              style={[
                styles.fill,
                { width: `${(rated / purchased.length) * 100}%` },
              ]}
            />
          </View>
        </View>
      )}
      {waiting.length ? (
        <View style={styles.rail}>
          {waiting.map(({ receipt, item }) => (
            <PressSurface
              key={item.id}
              accessibilityLabel={t('premium.openPurchased', {
                name: item.name,
              })}
              onPress={() =>
                router.push({
                  pathname: '/receipt/[receiptId]',
                  params: { receiptId: receipt.id },
                })
              }
              contentStyle={styles.card}
              spring
            >
              <FoodImage
                photo={
                  item.id === 'item_01' || item.id === 'item_02'
                    ? 'coffee'
                    : undefined
                }
                width={premium.rowThumb}
                height={premium.rowThumb}
              />
              <View style={styles.copy}>
                <Text variant="headline" numberOfLines={1}>
                  {item.name}
                </Text>
                <Text variant="caption" tone="secondary" numberOfLines={1}>
                  {receipt.restaurant.name}
                </Text>
              </View>
              <View style={styles.open}>
                <Text variant="caption" tone="inverse">
                  {t('homeFocus.rateNow')}
                </Text>
                <Icon
                  icon={ArrowUpRight}
                  size="small"
                  color={colors.surface}
                  decorative
                />
              </View>
            </PressSurface>
          ))}
        </View>
      ) : library.isPending ? (
        <DetailRowSkeleton />
      ) : (
        <View style={styles.empty}>
          <Text tone="secondary">
            {t(
              library.isError
                ? 'receipt.unavailable'
                : purchased.length
                  ? 'premium.allReviewed'
                  : 'homeFocus.empty',
            )}
          </Text>
          <PressSurface
            accessibilityLabel={t('homeFocus.startReceipt')}
            onPress={() => router.navigate('/scan')}
            contentStyle={styles.emptyScan}
          >
            <Text variant="callout" style={styles.accent}>
              {t('homeFocus.startReceipt')}
            </Text>
          </PressSurface>
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  section: { gap: spacing[12] },
  progressBlock: { gap: spacing[8] },
  track: {
    height: spacing[4],
    borderRadius: radius.pill,
    backgroundColor: colors.brand.tint,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.brand.primary,
    borderRadius: radius.pill,
  },
  empty: { gap: spacing[8] },
  emptyScan: { alignItems: 'flex-start' },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing[12],
  },
  count: {
    minWidth: spacing[24],
    padding: spacing[4],
    backgroundColor: colors.brand.tint,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  accent: { color: colors.brand.primary },
  rail: { gap: spacing[8] },
  card: {
    padding: spacing[8],
    paddingRight: spacing[12],
    backgroundColor: premium.canvas,
    borderRadius: radius[20],
    flexDirection: 'row',
    gap: spacing[12],
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  copy: { flex: 1, minWidth: 0, gap: spacing[4] },
  open: {
    flexDirection: 'row',
    gap: spacing[4],
    alignItems: 'center',
    backgroundColor: colors.brand.primary,
    borderRadius: radius.pill,
    minHeight: spacing[32],
    paddingHorizontal: spacing[12],
  },
});
