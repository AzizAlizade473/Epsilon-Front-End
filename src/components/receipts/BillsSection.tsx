import { useCallback, useRef } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import ReceiptText from 'lucide-react-native/icons/receipt-text';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { PressSurface } from '@/components/ui/PressSurface';
import { EmptyState } from '@/components/feedback/EmptyState';
import { DetailRowSkeleton } from '@/components/feedback/DetailRowSkeleton';
import { originalReceipts as o } from '@/design/original-receipts';
import { spacing } from '@/design';
import { useReceiptLibrary } from '@/hooks/useReceiptLibrary';
import { BillRow } from './BillRow';

export function BillsSection({
  receiptIds,
}: {
  receiptIds: readonly (string | null | undefined)[];
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const bills = useReceiptLibrary(receiptIds);
  const locked = useRef(false);
  useFocusEffect(
    useCallback(() => {
      locked.current = false;
    }, []),
  );
  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <Text style={styles.title} accessibilityRole="header">
          {t('originalReceipts.bills')}
        </Text>
        <PressSurface
          accessibilityLabel={t('originalReceipts.allBills')}
          onPress={() => router.push('/receipts')}
          contentStyle={styles.all}
        >
          <Text style={styles.allText}>{t('originalReceipts.all')}</Text>
        </PressSurface>
      </View>
      {bills.isPending && !bills.receipts.length ? (
        <DetailRowSkeleton />
      ) : bills.receipts.length ? (
        bills.receipts.slice(0, 3).map((receipt) => (
          <BillRow
            key={receipt.id}
            receipt={receipt}
            onPress={() => {
              if (!locked.current) {
                locked.current = true;
                router.push({
                  pathname: '/receipt/[receiptId]',
                  params: { receiptId: receipt.id },
                });
              }
            }}
          />
        ))
      ) : !bills.isError ? (
        <EmptyState
          icon={ReceiptText}
          title={t('originalReceipts.empty')}
          message={t('originalReceipts.emptyBody')}
        />
      ) : null}
      {bills.isError && (
        <>
          <Text accessibilityRole="alert">{t('receipt.unavailable')}</Text>
          <Button
            label={t('common.retry')}
            variant="ghost"
            loading={bills.isFetching}
            onPress={() => {
              void bills.refetch();
            }}
          />
        </>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  section: { gap: spacing[4] },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[12],
    marginBottom: spacing[12],
  },
  title: { ...o.type.title, fontSize: 17, color: o.colors.ink },
  all: {
    backgroundColor: o.colors.primaryTint,
    paddingHorizontal: spacing[12],
    borderRadius: o.radius.card,
  },
  allText: { ...o.type.caption, fontWeight: '700', color: o.colors.primary },
});
