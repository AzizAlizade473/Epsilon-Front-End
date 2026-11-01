import { decorativeSvgProps } from '@/lib/decorative-svg';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import Store from 'lucide-react-native/icons/store';
import Star from 'lucide-react-native/icons/star';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Amount } from '@/components/ui/Amount';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { PressSurface } from '@/components/ui/PressSurface';
import { Text } from '@/components/ui/Text';
import { MockDataNotice } from '@/components/feedback/MockDataNotice';
import { colors, layout, radius, spacing } from '@/design';
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
  const remaining = receipt.items.some(
    (item) =>
      !readOnly &&
      item.canRate &&
      item.rating === null &&
      !completedIds.includes(item.id),
  );
  const header = (
    <View style={styles.header}>
      <MockDataNotice />
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
            <Icon icon={Store} decorative />
          )}
        </View>
        <View style={styles.copy}>
          <Text variant="title2">{receipt.restaurant.name}</Text>
          <Text variant="caption">
            {t('receipt.branchDate', {
              branch: receipt.branch.name,
              date: formatDate(receipt.issuedAt, { locale: i18n.language }),
              time: formatTime(receipt.issuedAt),
            })}
          </Text>
        </View>
      </View>
      <Chip
        label={t(`receipt.status.${receipt.status}`)}
        tone={receipt.status === 'verified' ? 'success' : 'neutral'}
      />
      <Text variant="headline" accessibilityRole="header">
        {t('receipt.items')}
      </Text>
    </View>
  );
  return (
    <FlashList
      data={receipt.items}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={header}
      renderItem={({ item }) => {
        const pending = pendingIds.includes(item.id);
        const rated = item.rating !== null || completedIds.includes(item.id);
        const canRate = !readOnly && item.canRate && !rated && !pending;
        const content = (
          <>
            <View style={styles.copy}>
              <Text numberOfLines={2}>{item.name}</Text>
              <Text variant="caption">
                {t('receipt.quantityPrice', {
                  qty: item.quantity,
                  price: formatMoney(item.unitPriceMinor),
                })}
              </Text>
              {rated && (
                <View>
                  <Text variant="caption">{t('receipt.rated')}</Text>
                  {item.rating !== null && (
                    <View
                      accessible
                      style={styles.stars}
                      accessibilityLabel={t('feedback.ratingValue', {
                        count: item.rating,
                      })}
                    >
                      {Array.from({ length: 5 }, (_, index) => (
                        <Star
                          key={index}
                          size={spacing[16]}
                          strokeWidth={layout.iconStrokeWidth}
                          color={colors.ink}
                          fill={
                            index < (item.rating ?? 0)
                              ? colors.ink
                              : colors.transparent
                          }
                          {...decorativeSvgProps}
                        />
                      ))}
                    </View>
                  )}
                </View>
              )}
              {pending && (
                <Text variant="caption" accessibilityLiveRegion="polite">
                  {t('feedback.queued')}
                </Text>
              )}
            </View>
            {canRate && (
              <Text variant="caption" style={styles.rate}>
                {t('receipt.rate')}
              </Text>
            )}
          </>
        );
        return canRate ? (
          <PressSurface
            accessibilityLabel={t('receipt.rateItem', { name: item.name })}
            onPress={() => onRate(item)}
            contentStyle={styles.row}
          >
            {content}
          </PressSurface>
        ) : (
          <View style={styles.row}>{content}</View>
        );
      }}
      ListFooterComponent={
        <View style={styles.footer}>
          <Text variant="caption">{t('receipt.total')}</Text>
          <Amount minor={receipt.totalMinor} variant="title1" />
          {receipt.rewardHint && (
            <Text variant="caption">
              {t('receipt.rewardHint', {
                amount: formatMoney(receipt.rewardHint.amountMinor),
              })}
            </Text>
          )}
          <Text variant="caption" selectable>
            {t('receipt.identifier', { id: receipt.id })}
          </Text>
          {!remaining && <Button label={t('feedback.home')} onPress={onHome} />}
        </View>
      }
    />
  );
}
const styles = StyleSheet.create({
  header: { gap: spacing[16], paddingBottom: spacing[16] },
  restaurant: { flexDirection: 'row', gap: spacing[12], alignItems: 'center' },
  logo: {
    width: layout.receiptLogoSize,
    height: layout.receiptLogoSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, minWidth: 0, gap: spacing[4] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    paddingVertical: spacing[16],
    minHeight: layout.detailRowHeight,
    borderBottomWidth: layout.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rate: {
    borderRadius: radius.pill,
    backgroundColor: colors.brand.tint,
    color: colors.brand.primary,
    padding: spacing[8],
    flexShrink: 1,
  },
  footer: { gap: spacing[12], paddingVertical: spacing[24] },
  stars: { flexDirection: 'row', gap: spacing[4] },
});
