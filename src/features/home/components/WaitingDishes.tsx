import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import ArrowUpRight from 'lucide-react-native/icons/arrow-up-right';
import { PressSurface } from '@/components/ui/PressSurface';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { DetailRowSkeleton } from '@/components/feedback/DetailRowSkeleton';
import { FoodImage } from '@/components/food/FoodImage';
import { useReceiptLibrary } from '@/hooks/useReceiptLibrary';
import { useFeedback } from '@/providers/FeedbackProvider';
import { colors, layout, radius, spacing } from '@/design';
import { premium } from '@/design/premium';

/** Only actual verified purchased items can appear here. Opens the bill first. */
export function WaitingDishes({
  receiptIds,
}: {
  receiptIds: readonly (string | null | undefined)[];
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
  return (
    <View style={styles.section}>
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
        {t('premium.waitingHelp')}
      </Text>
      {waiting.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rail}
        >
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
                width={premium.thumb}
                height={premium.thumb}
              />
              <View style={styles.copy}>
                <Text variant="caption" tone="secondary">
                  {receipt.restaurant.name}
                </Text>
                <Text variant="headline">{item.name}</Text>
                <View style={styles.open}>
                  <Text variant="caption" style={styles.accent}>
                    {t('premium.openBill')}
                  </Text>
                  <Icon
                    icon={ArrowUpRight}
                    size="small"
                    color={colors.brand.primary}
                    decorative
                  />
                </View>
              </View>
            </PressSurface>
          ))}
        </ScrollView>
      ) : library.isPending ? (
        <DetailRowSkeleton />
      ) : (
        <Text tone="secondary">
          {t(library.isError ? 'receipt.unavailable' : 'premium.allReviewed')}
        </Text>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  section: { gap: spacing[12] },
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
  rail: { gap: spacing[12], paddingBottom: spacing[8] },
  card: {
    width: layout.scanViewfinderSize + spacing[24],
    padding: spacing[12],
    backgroundColor: premium.canvas,
    borderRadius: radius[24],
    flexDirection: 'row',
    gap: spacing[12],
    alignItems: 'center',
  },
  copy: { flex: 1, minWidth: 0, gap: spacing[8] },
  open: { flexDirection: 'row', gap: spacing[4], alignItems: 'center' },
});
