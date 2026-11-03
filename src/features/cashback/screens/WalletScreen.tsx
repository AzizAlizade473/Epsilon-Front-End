import { FlashList } from '@shopify/flash-list';
import Wallet from 'lucide-react-native/icons/wallet';
import { useRouter } from 'expo-router';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { PurchaseAmount } from '@/components/purchase/PurchaseAmount';
import { WalletPassport } from '../components/WalletPassport';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Skeleton } from '@/components/feedback/Skeleton';
import { DetailRowSkeleton } from '@/components/feedback/DetailRowSkeleton';
import { MockDataNotice } from '@/components/feedback/MockDataNotice';
import { TransactionRow } from '@/components/wallet/TransactionRow';
import { colors, layout, spacing } from '@/design';
import { useWallet } from '@/hooks/useWallet';
import { useWalletHistory } from '@/hooks/useWalletHistory';
import { useStaleRefetchOnFocus } from '@/hooks/useStaleRefetchOnFocus';
import { queryKeys } from '@/services/query';
import { groupWalletHistory } from '@/lib/wallet-history';

export default function WalletScreen() {
  const wallet = useWallet();
  const history = useWalletHistory();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const nextLock = useRef(false);
  const refreshLock = useRef(false);
  useStaleRefetchOnFocus(queryKeys.wallet.all);
  const grouped = groupWalletHistory(history.data?.items ?? [], i18n.language);
  const refresh = async () => {
    if (refreshLock.current) return;
    refreshLock.current = true;
    try {
      await Promise.all([wallet.refetch(), history.refetch()]);
    } finally {
      refreshLock.current = false;
    }
  };
  const next = async () => {
    if (nextLock.current || !history.hasNextPage || history.isFetching) return;
    nextLock.current = true;
    try {
      await history.fetchNextPage();
    } finally {
      nextLock.current = false;
    }
  };
  return (
    <Screen surface="surface" scroll={false} edges={['top', 'left', 'right']}>
      <View style={styles.hero}>
        <Text variant="title1" accessibilityRole="header">
          {t('navigation.cashback')}
        </Text>
        <WalletPassport pendingMinor={wallet.data?.pendingMinor}>
          {wallet.data ? (
            <PurchaseAmount minor={wallet.data.balanceMinor} />
          ) : wallet.isLoading ? (
            <Skeleton
              width={layout.balanceSkeletonWidth}
              height={layout.controlHeight}
              accessibilityLabel={t('common.loading')}
            />
          ) : null}
        </WalletPassport>
        <Text variant="headline">{t('visual.history')}</Text>
        {wallet.isError && (
          <Text tone="danger" accessibilityRole="alert">
            {t('wallet.loadError')}
          </Text>
        )}
        {wallet.isError && (
          <Button
            variant="ghost"
            label={t('common.retry')}
            onPress={() => {
              void wallet.refetch();
            }}
            loading={wallet.isFetching}
          />
        )}
      </View>
      {history.isLoading ? (
        <View>
          {Array.from({ length: 6 }, (_, index) => (
            <DetailRowSkeleton key={index} />
          ))}
        </View>
      ) : !history.data && history.isError ? (
        <ErrorState
          title={t('wallet.loadError')}
          retryLabel={t('common.retry')}
          onRetry={() => {
            void history.refetch();
          }}
          loading={history.isFetching}
        />
      ) : (
        <FlashList
          contentContainerStyle={styles.listContent}
          data={grouped.rows}
          keyExtractor={(item) => item.key}
          getItemType={(item) => item.kind}
          stickyHeaderIndices={grouped.stickyHeaderIndices}
          refreshControl={
            <PullToRefresh
              refreshing={
                (history.isRefetching && !history.isFetchingNextPage) ||
                wallet.isRefetching
              }
              onRefresh={() => {
                void refresh();
              }}
            />
          }
          refreshing={
            (history.isRefetching && !history.isFetchingNextPage) ||
            wallet.isRefetching
          }
          onRefresh={() => {
            void refresh();
          }}
          onEndReached={() => {
            void next();
          }}
          renderItem={({ item }) =>
            item.kind === 'date' ? (
              <View style={styles.date}>
                <Text variant="caption" accessibilityRole="header">
                  {item.label}
                </Text>
              </View>
            ) : (
              <TransactionRow
                history
                transaction={item.transaction}
                onPress={() =>
                  router.push({
                    pathname: '/cashback/transaction/[id]',
                    params: { id: item.transaction.id },
                  })
                }
              />
            )
          }
          ListEmptyComponent={
            <EmptyState
              icon={Wallet}
              title={t('wallet.emptyTitle')}
              message={t('wallet.emptyBody')}
              action={{
                label: t('home.scan'),
                onPress: () => router.push('/scan'),
              }}
            />
          }
          ListFooterComponent={
            <View style={styles.footer}>
              <MockDataNotice />
              {history.isError && (
                <Text tone="danger" accessibilityRole="alert">
                  {t('wallet.loadError')}
                </Text>
              )}
              {history.hasNextPage || history.isError ? (
                <Button
                  variant="ghost"
                  label={t(history.isError ? 'common.retry' : 'wallet.more')}
                  loading={history.isFetchingNextPage}
                  onPress={() => {
                    if (history.isFetchNextPageError) void next();
                    else if (history.isError) void history.refetch();
                    else void next();
                  }}
                />
              ) : (
                grouped.rows.length > 0 && (
                  <Text variant="caption">{t('wallet.end')}</Text>
                )
              )}
            </View>
          }
        />
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({
  listContent: { paddingRight: Platform.OS === 'web' ? spacing[16] : 0 },
  hero: { gap: spacing[12], paddingBottom: spacing[16] },
  date: { backgroundColor: colors.surface, paddingVertical: spacing[12] },
  footer: { paddingVertical: spacing[20], gap: spacing[12] },
});
