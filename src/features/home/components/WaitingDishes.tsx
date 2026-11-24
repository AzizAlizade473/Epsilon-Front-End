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
import { BrandBadge } from '@/components/brand/BrandBadge';
import { displayMerchantName } from '@/lib/brands';
import { dishName } from '@/lib/dish-name';
import { premium } from '@/design/premium';
import { formatDate } from '@/lib/date';

/** Only actual verified purchased items appear here, grouped by visit; a visit opens its first dish to rate. */
export function WaitingDishes({
  receiptIds,
  embedded = false,
}: {
  receiptIds: readonly (string | null | undefined)[];
  /** Inside Home's combined section: the parent owns the heading. */
  embedded?: boolean;
}) {
  const { t, i18n } = useTranslation();
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
    .slice(0, 12);
  // One card per restaurant visit: the meal, not a list of chores.
  const visits = library.receipts
    .map((receipt) => ({
      receipt,
      dishes: waiting
        .filter((entry) => entry.receipt.id === receipt.id)
        .map((entry) => entry.item),
      started: receipt.items.some(
        (item) =>
          item.rating !== null || feedback.completedIds.includes(item.id),
      ),
    }))
    .filter((visit) => visit.dishes.length > 0)
    .slice(0, 4);
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
      {visits.length ? (
        <View style={styles.rail}>
          {visits.map(({ receipt, dishes, started }) => {
            const merchant =
              receipt.fiscal?.merchant.objectName ?? receipt.restaurant.name;
            const place = displayMerchantName(merchant);
            return (
              <PressSurface
                key={receipt.id}
                accessibilityLabel={t('home.visitA11y', {
                  place,
                  count: dishes.length,
                })}
                onPress={() =>
                  router.push({
                    pathname: '/rate/[receiptItemId]',
                    params: {
                      receiptItemId: dishes[0]!.id,
                      receiptId: receipt.id,
                    },
                  })
                }
                contentStyle={styles.visit}
                spring
              >
                <View style={styles.visitHead}>
                  {dishes.some((d) => d.id === 'item_01') ? (
                    <FoodImage
                      photo="coffee"
                      width={premium.rowThumb}
                      height={premium.rowThumb}
                    />
                  ) : (
                    <BrandBadge
                      name={merchant}
                      logoUrl={receipt.restaurant.logoUrl}
                      size={premium.rowThumb}
                    />
                  )}
                  <View style={styles.copy}>
                    <Text variant="headline" numberOfLines={1}>
                      {place}
                    </Text>
                    <Text variant="caption" tone="secondary">
                      {formatDate(receipt.issuedAt, { locale: i18n.language }) +
                        ' · ' +
                        t('home.toRate', { count: dishes.length })}
                    </Text>
                  </View>
                </View>
                <View style={styles.dishes}>
                  {dishes.slice(0, 3).map((item) => (
                    <Text key={item.id} variant="callout" numberOfLines={2}>
                      {dishName(item.name)}
                    </Text>
                  ))}
                  {dishes.length > 3 && (
                    <Text variant="caption" tone="secondary">
                      {t('home.more', { count: dishes.length - 3 })}
                    </Text>
                  )}
                </View>
                <View style={styles.open}>
                  <Text variant="callout" tone="inverse">
                    {t(started ? 'home.continue' : 'home.rateMeal')}
                  </Text>
                  <Icon
                    icon={ArrowUpRight}
                    size="small"
                    color={colors.surface}
                    decorative
                  />
                </View>
              </PressSurface>
            );
          })}
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
  visit: {
    padding: spacing[16],
    backgroundColor: premium.canvas,
    borderRadius: radius[20],
    gap: spacing[12],
    alignItems: 'stretch',
  },
  visitHead: { flexDirection: 'row', gap: spacing[12], alignItems: 'center' },
  dishes: {
    gap: spacing[4],
    paddingLeft: spacing[12],
    borderLeftWidth: 2,
    borderLeftColor: colors.brand.tint,
  },
  copy: { flex: 1, minWidth: 0, gap: spacing[4] },
  open: {
    flexDirection: 'row',
    gap: spacing[4],
    alignItems: 'center',
    backgroundColor: colors.brand.primary,
    borderRadius: radius.pill,
    minHeight: 40,
    paddingHorizontal: spacing[16],
    alignSelf: 'flex-start',
  },
});
