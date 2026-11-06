import { FlashList } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, View } from 'react-native';
import MapPin from 'lucide-react-native/icons/map-pin';
import Gift from 'lucide-react-native/icons/gift';
import X from 'lucide-react-native/icons/x';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { MockDataNotice } from '@/components/feedback/MockDataNotice';
import { spacing } from '@/design';
import { originalReceipts as o } from '@/design/original-receipts';
import { formatMoney } from '@/lib/money';
import { formatDate, formatTime } from '@/lib/date';
import type { Receipt, ReceiptItem } from '@/services/contracts';
import { DishCard } from './DishCard';

/** Port of original HomeScreen's receipt-detail bottom sheet. */
export function ReceiptContent({
  receipt,
  pendingIds,
  completedIds,
  onRate,
  onHome,
  onClose,
}: {
  receipt: Receipt;
  pendingIds: readonly string[];
  completedIds: readonly string[];
  onRate: (item: ReceiptItem, rating?: number) => void;
  onHome: () => void;
  onClose?: () => void;
}) {
  const { t, i18n } = useTranslation();
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
      <View style={styles.top}>
        <View style={styles.copy}>
          <Text
            style={styles.amount}
            accessibilityLabel={formatMoney(receipt.totalMinor)}
          >
            {formatMoney(receipt.totalMinor)}
          </Text>
          <Text style={styles.sub}>{'#' + receipt.id}</Text>
          <Text style={styles.name}>{receipt.restaurant.name}</Text>
          <View style={styles.branch}>
            <Icon
              icon={MapPin}
              size="small"
              color={o.colors.rated}
              decorative
            />
            <Text style={[styles.sub, styles.branchText]}>
              {receipt.branch.name}
            </Text>
          </View>
          <Text style={styles.sub}>
            {formatDate(receipt.issuedAt, { locale: i18n.language }) +
              ' · ' +
              formatTime(receipt.issuedAt)}
          </Text>
        </View>
        {onClose && (
          <IconButton
            icon={X}
            accessibilityLabel={t('navigation.close')}
            onPress={onClose}
          />
        )}
      </View>
      <Chip
        label={t('receipt.status.' + receipt.status)}
        tone={readOnly ? 'neutral' : 'success'}
      />
      {receipt.rewardHint && (
        <View style={styles.hint}>
          <Icon icon={Gift} size="small" color={o.colors.ink} decorative />
          <Text style={styles.hintText}>
            {t('receipt.rewardHint', {
              amount: formatMoney(receipt.rewardHint.amountMinor),
            })}
          </Text>
        </View>
      )}
      <Text style={styles.section} accessibilityRole="header">
        {t('receipt.items')}
      </Text>
    </View>
  );
  return (
    <FlashList
      data={receipt.items}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={header}
      renderItem={({ item }) => (
        <DishCard
          item={item}
          readOnly={readOnly}
          pending={pendingIds.includes(item.id)}
          completed={completedIds.includes(item.id)}
          onRate={(rating) =>
            rating === undefined ? onRate(item) : onRate(item, rating)
          }
        />
      )}
      ListFooterComponent={
        <View style={styles.footer}>
          {!remaining && <Button label={t('feedback.home')} onPress={onHome} />}
          <MockDataNotice />
        </View>
      }
    />
  );
}
const styles = StyleSheet.create({
  list: { paddingRight: Platform.OS === 'web' ? spacing[12] : 0 },
  header: { gap: spacing[12], paddingBottom: spacing[16] },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing[12],
  },
  copy: { flex: 1, minWidth: 0, gap: spacing[4] },
  amount: { ...o.type.amount, color: o.colors.ink },
  sub: { ...o.type.caption, color: o.colors.secondary },
  name: { ...o.type.product, color: o.colors.ink },
  branch: { flexDirection: 'row', alignItems: 'center', gap: spacing[4] },
  branchText: { flex: 1 },
  section: { ...o.type.product, color: o.colors.ink, paddingTop: spacing[4] },
  hint: {
    backgroundColor: o.colors.star,
    borderRadius: o.radius.card,
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[8],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
    alignSelf: 'flex-start',
  },
  hintText: {
    ...o.type.caption,
    fontWeight: '700',
    color: o.colors.ink,
    flexShrink: 1,
  },
  footer: { gap: spacing[12], paddingVertical: spacing[16] },
});
