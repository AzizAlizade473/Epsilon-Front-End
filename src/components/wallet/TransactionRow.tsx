import ArrowDownLeft from 'lucide-react-native/icons/arrow-down-left';
import ArrowUpRight from 'lucide-react-native/icons/arrow-up-right';
import RotateCcw from 'lucide-react-native/icons/rotate-ccw';
import Clock from 'lucide-react-native/icons/clock';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { PressSurface } from '@/components/ui/PressSurface';
import { Text } from '@/components/ui/Text';
import { colors, layout, spacing } from '@/design';
import { formatDate, formatTime } from '@/lib/date';
import { TransactionTypeIcon } from './TransactionTypeIcon';
import { formatMoney } from '@/lib/money';
import type { WalletTransaction } from '@/services/contracts';

const icons = {
  earned: ArrowDownLeft,
  redeemed: ArrowUpRight,
  reversed: RotateCcw,
  expired: Clock,
};
export function TransactionRow({
  transaction,
  onPress,
  history = false,
}: {
  transaction: WalletTransaction;
  onPress?: () => void;
  history?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const title = transaction.source?.restaurantName ?? t('navigation.cashback');
  const status = t(`wallet.status.${transaction.status}`);
  const amount = formatMoney(transaction.amountMinor, { sign: 'always' });
  const date = formatDate(transaction.createdAt, { locale: i18n.language });
  const label = [title, transaction.itemName, status, amount, date]
    .filter(Boolean)
    .join(', ');
  const content = (
    <>
      {history ? (
        <TransactionTypeIcon type={transaction.type} />
      ) : (
        <Icon icon={icons[transaction.type]} decorative />
      )}
      <View style={styles.copy}>
        <Text>{title}</Text>
        {!history && transaction.itemName && (
          <Text variant="caption">{transaction.itemName}</Text>
        )}
        <Text variant="caption">
          {history
            ? `${t(`wallet.type.${transaction.type}`)} · ${formatTime(transaction.createdAt)}`
            : `${status} · ${date}`}
        </Text>
        {history && transaction.status !== 'confirmed' && (
          <Text variant="caption">{status}</Text>
        )}
      </View>
      <Text
        variant="headline"
        style={[
          styles.amount,
          {
            color:
              transaction.status === 'pending'
                ? colors.inkSecondary
                : transaction.type === 'earned' &&
                    transaction.status === 'confirmed'
                  ? colors.successInk
                  : colors.ink,
          },
        ]}
      >
        {amount}
      </Text>
    </>
  );
  return (
    <View style={styles.border}>
      {onPress ? (
        <PressSurface
          accessibilityLabel={label}
          onPress={onPress}
          contentStyle={styles.row}
        >
          {content}
        </PressSurface>
      ) : (
        <View accessible accessibilityLabel={label} style={styles.row}>
          {content}
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  border: {
    borderBottomWidth: layout.hairlineWidth,
    borderBottomColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    minHeight: layout.detailRowHeight,
    alignItems: 'center',
    gap: spacing[12],
    paddingVertical: spacing[12],
  },
  copy: { flex: 1, minWidth: 0, gap: spacing[4] },
  amount: { flexShrink: 1, textAlign: 'right', maxWidth: '45%' },
});
