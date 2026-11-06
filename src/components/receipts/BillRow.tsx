import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import MapPin from 'lucide-react-native/icons/map-pin';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { originalReceipts as o } from '@/design/original-receipts';
import { spacing } from '@/design';
import { formatMoney } from '@/lib/money';
import { formatTime } from '@/lib/date';
import type { Receipt } from '@/services/contracts';

/** Port of original HomeScreen receiptRow/dateBadge/statusBadge composition. */
export function BillRow({
  receipt,
  onPress,
}: {
  receipt: Receipt;
  onPress: () => void;
}) {
  const { t, i18n } = useTranslation();
  const date = new Date(receipt.issuedAt);
  const month = new Intl.DateTimeFormat(i18n.language, {
    month: 'short',
  }).format(date);
  const rateable = receipt.items.filter(
    (item) => item.canRate || item.rating !== null,
  );
  const done =
    rateable.length > 0 && rateable.every((item) => item.rating !== null);
  const status =
    receipt.status !== 'verified'
      ? t('receipt.status.' + receipt.status)
      : done
        ? t('originalReceipts.rated')
        : rateable.length
          ? t('originalReceipts.pending')
          : t('receipt.status.verified');
  const title = t('originalReceipts.bill', { id: receipt.id.slice(-4) });
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={[
        title,
        receipt.restaurant.name,
        status,
        formatMoney(receipt.totalMinor),
      ].join(', ')}
      onPress={onPress}
      style={styles.row}
    >
      <View style={styles.date}>
        <Text style={styles.month}>{month}</Text>
        <Text style={styles.day}>{date.getDate()}</Text>
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>
          {t('originalReceipts.dishes', { count: receipt.items.length }) +
            ' · ' +
            formatTime(receipt.issuedAt)}
        </Text>
        <View style={styles.branch}>
          <Icon icon={MapPin} size="small" color={o.colors.rated} decorative />
          <Text style={[styles.sub, styles.branchCopy]}>
            {receipt.restaurant.name + ' · ' + receipt.branch.name}
          </Text>
        </View>
      </View>
      <View style={styles.amount}>
        <Text style={styles.price}>{formatMoney(receipt.totalMinor)}</Text>
        <Text style={[styles.badge, done ? styles.rated : styles.pending]}>
          {status}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
const styles = StyleSheet.create({
  row: {
    ...o.shadow,
    backgroundColor: o.colors.surface,
    borderRadius: o.radius.card,
    padding: spacing[16],
    marginBottom: spacing[12],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    borderWidth: 1,
    borderColor: o.colors.soft,
  },
  date: {
    width: o.size.date,
    minHeight: o.size.date,
    borderRadius: o.radius.dish,
    backgroundColor: o.colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: o.colors.border,
  },
  month: {
    ...o.type.caption,
    fontWeight: '700',
    color: o.colors.secondary,
    textTransform: 'uppercase',
  },
  day: { fontSize: 16, lineHeight: 20, fontWeight: '700', color: o.colors.ink },
  copy: { flex: 1, minWidth: 0, gap: spacing[4] },
  title: { ...o.type.product, color: o.colors.ink },
  sub: { ...o.type.caption, color: o.colors.secondary },
  branch: { flexDirection: 'row', alignItems: 'center', gap: spacing[4] },
  branchCopy: { flex: 1 },
  amount: { alignItems: 'flex-end', maxWidth: '34%', gap: spacing[4] },
  price: { ...o.type.product, fontSize: 15, color: o.colors.ink },
  badge: {
    ...o.type.caption,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: o.radius.badge,
    overflow: 'hidden',
  },
  rated: { backgroundColor: o.colors.ratedTint, color: o.colors.rated },
  pending: { backgroundColor: o.colors.pendingTint, color: o.colors.pending },
});
