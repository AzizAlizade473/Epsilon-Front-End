import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import Store from 'lucide-react-native/icons/store';
import ArrowUpRight from 'lucide-react-native/icons/arrow-up-right';
import Check from 'lucide-react-native/icons/check';
import Star from 'lucide-react-native/icons/star';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { PressSurface } from '@/components/ui/PressSurface';
import { Text } from '@/components/ui/Text';
import { ReceiptRule } from '@/components/ui/ReceiptRule';
import { PurchaseAmount } from '@/components/purchase/PurchaseAmount';
import { RatingProgress } from '@/components/purchase/RatingProgress';
import { MockDataNotice } from '@/components/feedback/MockDataNotice';
import { colors, layout, radius, spacing } from '@/design';
import { purchaseDesign as p } from '@/design/purchase';
import { decorativeSvgProps } from '@/lib/decorative-svg';
import { formatDate, formatTime } from '@/lib/date';
import { formatMoney } from '@/lib/money';
import type { Receipt, ReceiptItem } from '@/services/contracts';

export function ReceiptContent({
  receipt,
  pendingIds,
  completedIds,
  onRate,
  onHome,
}: {
  receipt: Receipt;
  pendingIds: readonly string[];
  completedIds: readonly string[];
  onRate: (item: ReceiptItem) => void;
  onHome: () => void;
}) {
  const { t, i18n } = useTranslation();
  const [failedLogo, setFailedLogo] = useState(false);
  const readOnly = receipt.status !== 'verified';
  const rated = (item: ReceiptItem) =>
    item.rating !== null || completedIds.includes(item.id);
  const rateable = receipt.items.filter((item) => item.canRate || rated(item));
  const remaining = receipt.items.some(
    (item) => !readOnly && item.canRate && !rated(item),
  );
  const header = (
    <View style={styles.header}>
      <View style={styles.meta}>
        <Text variant="caption" tone="secondary">
          {t('purchaseDirection.receiptIntro')}
        </Text>
        <Chip
          label={t('receipt.status.' + receipt.status)}
          tone={readOnly ? 'neutral' : 'success'}
        />
      </View>
      <View style={styles.restaurant}>
        <View style={styles.logo}>
          {receipt.restaurant.logoUrl?.startsWith('https://') && !failedLogo ? (
            <Image
              source={{ uri: receipt.restaurant.logoUrl }}
              style={styles.logo}
              contentFit="contain"
              recyclingKey={receipt.restaurant.id}
              accessible={false}
              onError={() => setFailedLogo(true)}
            />
          ) : (
            <Icon icon={Store} color={colors.brand.primary} decorative />
          )}
        </View>
        <View style={styles.copy}>
          <Text variant="title2" style={styles.ink}>
            {receipt.restaurant.name}
          </Text>
          <Text variant="caption" tone="secondary">
            {t('receipt.branchDate', {
              branch: receipt.branch.name,
              date: formatDate(receipt.issuedAt, { locale: i18n.language }),
              time: formatTime(receipt.issuedAt),
            })}
          </Text>
        </View>
      </View>
      <ReceiptRule />
      <View style={styles.total}>
        <Text variant="caption" tone="secondary">
          {t('purchaseDirection.receiptTotal')}
        </Text>
        <PurchaseAmount minor={receipt.totalMinor} />
      </View>
      <RatingProgress
        done={rateable.filter(rated).length}
        total={rateable.length}
      />
      <Text variant="headline" accessibilityRole="header">
        {t('receipt.items')}
      </Text>
    </View>
  );
  return (
    <FlashList
      contentContainerStyle={styles.listContent}
      data={receipt.items}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={header}
      renderItem={({ item, index }) => {
        const pending = pendingIds.includes(item.id),
          done = rated(item);
        const canRate = !readOnly && item.canRate && !done && !pending;
        const content = (
          <>
            <View style={styles.ordinal}>
              <Text style={[p.ordinal, styles.ink]}>
                {String(index + 1).padStart(2, '0')}
              </Text>
              <View style={styles.ordinalLine} />
            </View>
            <View style={styles.copy}>
              <Text variant="headline">{item.name}</Text>
              <Text variant="caption" tone="secondary">
                {t('receipt.quantityPrice', {
                  qty: item.quantity,
                  price: formatMoney(item.unitPriceMinor),
                })}
              </Text>
              {done && (
                <View style={styles.rated}>
                  <Icon
                    icon={Check}
                    size="small"
                    color={colors.brand.primary}
                    decorative
                  />
                  <Text variant="caption" style={styles.ink}>
                    {t('receipt.rated')}
                  </Text>
                </View>
              )}
              {done && item.rating !== null && (
                <View
                  accessible
                  style={styles.stars}
                  accessibilityLabel={t('feedback.ratingValue', {
                    count: item.rating,
                  })}
                >
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      size={spacing[16]}
                      strokeWidth={layout.iconStrokeWidth}
                      color={colors.brand.primary}
                      fill={
                        i < (item.rating ?? 0)
                          ? colors.brand.primary
                          : colors.transparent
                      }
                      {...decorativeSvgProps}
                    />
                  ))}
                </View>
              )}
              {pending && (
                <Text variant="caption" accessibilityLiveRegion="polite">
                  {t('feedback.queued')}
                </Text>
              )}
            </View>
            {canRate && (
              <View style={styles.rate}>
                <Icon
                  icon={ArrowUpRight}
                  decorative
                  color={colors.brand.primary}
                />
                <Text variant="caption" style={styles.ink}>
                  {t('receipt.rate')}
                </Text>
              </View>
            )}
          </>
        );
        return (
          <View style={styles.slip}>
            {canRate ? (
              <PressSurface
                accessibilityLabel={t('receipt.rateItem', { name: item.name })}
                onPress={() => onRate(item)}
                contentStyle={styles.row}
              >
                {content}
              </PressSurface>
            ) : (
              <View style={styles.row}>{content}</View>
            )}
          </View>
        );
      }}
      ListFooterComponent={
        <View style={styles.footer}>
          <ReceiptRule />
          <View style={styles.footerTotal}>
            <Text variant="callout">{t('receipt.total')}</Text>
            <Text variant="headline" style={styles.ink}>
              {formatMoney(receipt.totalMinor)}
            </Text>
          </View>
          {receipt.rewardHint && (
            <Text variant="caption" tone="secondary">
              {t('receipt.rewardHint', {
                amount: formatMoney(receipt.rewardHint.amountMinor),
              })}
            </Text>
          )}
          <Text variant="caption" tone="secondary" selectable>
            {t('receipt.identifier', { id: receipt.id })}
          </Text>
          {!remaining && <Button label={t('feedback.home')} onPress={onHome} />}
          <MockDataNotice />
        </View>
      }
    />
  );
}
const styles = StyleSheet.create({
  listContent: { paddingRight: Platform.OS === 'web' ? spacing[16] : 0 },
  header: { gap: spacing[20], paddingBottom: spacing[20] },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing[12],
  },
  restaurant: { flexDirection: 'row', alignItems: 'center', gap: spacing[12] },
  logo: {
    width: layout.receiptLogoSize,
    height: layout.receiptLogoSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, minWidth: 0, gap: spacing[8] },
  ink: { color: colors.brand.primary },
  total: { gap: spacing[8], paddingVertical: spacing[8] },
  slip: {
    backgroundColor: colors.surface,
    marginBottom: spacing[12],
    borderWidth: layout.borderWidth,
    borderColor: colors.brand.border,
    borderRadius: p.slipRadius,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[16],
    padding: spacing[16],
    minHeight: p.dishSize,
  },
  ordinal: { alignSelf: 'stretch', justifyContent: 'center', gap: spacing[4] },
  ordinalLine: {
    height: layout.borderWidth,
    backgroundColor: colors.brand.border,
  },
  rate: {
    alignItems: 'center',
    gap: spacing[4],
    backgroundColor: colors.brand.tint,
    padding: spacing[8],
    borderRadius: radius[12],
  },
  rated: { flexDirection: 'row', alignItems: 'center', gap: spacing[4] },
  stars: { flexDirection: 'row', gap: spacing[4] },
  footer: { gap: spacing[16], paddingVertical: spacing[16] },
  footerTotal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[12],
  },
});
