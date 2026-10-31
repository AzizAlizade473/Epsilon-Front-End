import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Sheet } from '@/components/ui/Sheet';
import { Amount } from '@/components/ui/Amount';
import { Chip } from '@/components/ui/Chip';
import { ListRow } from '@/components/ui/ListRow';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/feedback/ErrorState';
import { DetailRowSkeleton } from '@/components/feedback/DetailRowSkeleton';
import { TransactionTypeIcon } from '@/components/wallet/TransactionTypeIcon';
import { spacing } from '@/design';
import { useWalletTransaction } from '@/hooks/useWalletHistory';
import { useToast } from '@/providers/ToastProvider';
import { formatDate, formatTime } from '@/lib/date';
import type { WalletTransaction } from '@/services/contracts';

export function TransactionScreen({
  copy,
}: {
  copy: (value: string) => Promise<boolean>;
}) {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const query = useWalletTransaction(id);
  const router = useRouter();
  const { t } = useTranslation();
  const close = () =>
    router.canGoBack() ? router.back() : router.replace('/cashback');
  return (
    <Sheet onClose={close} accessibilityLabel={t('wallet.details')}>
      <ScrollView keyboardShouldPersistTaps="handled">
        {query.data ? (
          <>
            <TransactionContent transaction={query.data} copy={copy} />
            {query.isError && (
              <>
                <Text tone="danger" accessibilityRole="alert">
                  {t('wallet.refreshError')}
                </Text>
                <Button
                  label={t('common.retry')}
                  variant="ghost"
                  onPress={() => {
                    void query.refetch();
                  }}
                />
              </>
            )}
          </>
        ) : query.isLoading ? (
          <DetailRowSkeleton />
        ) : (
          <ErrorState
            title={t('wallet.transactionUnavailable')}
            retryLabel={t('common.retry')}
            onRetry={() => {
              void query.refetch();
            }}
            loading={query.isFetching}
          />
        )}
      </ScrollView>
    </Sheet>
  );
}
export function TransactionContent({
  transaction,
  copy,
}: {
  transaction: WalletTransaction;
  copy: (value: string) => Promise<boolean>;
}) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const copyValue = async (value: string) => {
    try {
      if (!(await copy(value))) throw new Error('Clipboard unavailable');
      toast(t('wallet.copied'));
    } catch {
      toast(t('errors.generic'));
    }
  };
  const rows = [
    ['restaurant', transaction.source?.restaurantName],
    ['branch', transaction.source?.branchName],
    ['dish', transaction.itemName],
    [
      'date',
      `${formatDate(transaction.createdAt, { locale: i18n.language })}, ${formatTime(transaction.createdAt)}`,
    ],
    ['receiptId', transaction.receiptId],
    ['transactionId', transaction.id],
  ] as const;
  return (
    <View style={styles.content}>
      <View style={styles.hero}>
        <TransactionTypeIcon detail type={transaction.type} />
        <Text variant="headline">{t(`wallet.type.${transaction.type}`)}</Text>
        <Amount
          minor={transaction.amountMinor}
          sign="always"
          variant="title1"
          tone={
            transaction.status === 'confirmed' && transaction.type === 'earned'
              ? 'success'
              : transaction.status === 'pending'
                ? 'secondary'
                : 'default'
          }
        />
        <Chip
          label={t(`wallet.status.${transaction.status}`)}
          tone={
            transaction.status === 'confirmed'
              ? 'success'
              : transaction.status === 'pending'
                ? 'warning'
                : 'danger'
          }
        />
      </View>
      {rows.map(([key, value]) =>
        value ? (
          <ListRow
            key={key}
            title={t(`wallet.fields.${key}`)}
            value={value}
            chevron={false}
            accessibilityLabel={t('wallet.copyValue', {
              label: t(`wallet.fields.${key}`),
              value,
            })}
            onPress={
              key === 'receiptId' || key === 'transactionId'
                ? () => {
                    void copyValue(value);
                  }
                : undefined
            }
          />
        ) : null,
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  content: { gap: spacing[12] },
  hero: {
    alignItems: 'center',
    gap: spacing[16],
    paddingVertical: spacing[16],
  },
});
