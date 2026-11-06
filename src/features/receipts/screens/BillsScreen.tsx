import { useCallback, useRef } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlashList } from '@shopify/flash-list';
import ReceiptText from 'lucide-react-native/icons/receipt-text';
import { Screen } from '@/components/ui/Screen';
import { BackButton } from '@/components/navigation/BackButton';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { EmptyState } from '@/components/feedback/EmptyState';
import { DetailRowSkeleton } from '@/components/feedback/DetailRowSkeleton';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { useWalletHistory } from '@/hooks/useWalletHistory';
import { useReceiptLibrary } from '@/hooks/useReceiptLibrary';
import { BillRow } from '@/components/receipts/BillRow';

export function BillsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const history = useWalletHistory();
  const bills = useReceiptLibrary(
    history.data?.items.map((item) => item.receiptId),
  );
  const locked = useRef(false),
    nextLocked = useRef(false);
  useFocusEffect(
    useCallback(() => {
      locked.current = false;
    }, []),
  );
  const next = async () => {
    if (!history.hasNextPage || history.isFetching || nextLocked.current)
      return;
    nextLocked.current = true;
    try {
      await history.fetchNextPage();
    } finally {
      nextLocked.current = false;
    }
  };
  return (
    <Screen
      surface="receiptCanvas"
      title={t('originalReceipts.bills')}
      scroll={false}
      leading={
        <BackButton
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace('/home')
          }
        />
      }
    >
      <FlashList
        data={bills.receipts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <BillRow
            receipt={item}
            onPress={() => {
              if (!locked.current) {
                locked.current = true;
                router.replace({
                  pathname: '/receipt/[receiptId]',
                  params: { receiptId: item.id },
                });
              }
            }}
          />
        )}
        refreshControl={
          <PullToRefresh
            refreshing={history.isRefetching || bills.isFetching}
            onRefresh={() => {
              void Promise.all([history.refetch(), bills.refetch()]);
            }}
          />
        }
        ListEmptyComponent={
          history.isPending || bills.isPending ? (
            <DetailRowSkeleton />
          ) : (
            <EmptyState
              icon={ReceiptText}
              title={t('originalReceipts.empty')}
              message={t('originalReceipts.emptyBody')}
            />
          )
        }
        ListFooterComponent={
          <>
            {(history.isError || bills.isError) && (
              <>
                <Text accessibilityRole="alert">
                  {t('receipt.unavailable')}
                </Text>
                <Button
                  label={t('common.retry')}
                  onPress={() => {
                    void Promise.all([history.refetch(), bills.refetch()]);
                  }}
                />
              </>
            )}
            {history.hasNextPage && (
              <Button
                label={t('product.loadMore')}
                loading={history.isFetchingNextPage}
                onPress={() => {
                  void next();
                }}
              />
            )}
          </>
        }
      />
    </Screen>
  );
}
