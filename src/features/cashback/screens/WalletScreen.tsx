import { FlashList } from '@shopify/flash-list';
import Wallet from 'lucide-react-native/icons/wallet';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { IconButton } from '@/components/ui/IconButton';
import { PressSurface } from '@/components/ui/PressSurface';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { Amount } from '@/components/ui/Amount';
import { WalletSurface } from '@/components/wallet/WalletSurface';
import { WalletDetails } from '@/components/wallet/WalletDetails';
import {
  WalletEntrance,
  useWalletArrival,
  useWalletJourney,
  type WalletCardRef,
} from '@/components/wallet/WalletJourney';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Skeleton } from '@/components/feedback/Skeleton';
import { DetailRowSkeleton } from '@/components/feedback/DetailRowSkeleton';
import { MockDataNotice } from '@/components/feedback/MockDataNotice';
import { TransactionRow } from '@/components/wallet/TransactionRow';
import { colors, layout, spacing } from '@/design';
import { walletDesign as w } from '@/design/wallet';
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
  const card = useRef<WalletCardRef>(null);
  const arrive = useWalletArrival(card);
  const journey = useWalletJourney();
  const [expanded, setExpanded] = useState(false);
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
  const header = (
    <>
      <View style={styles.hero}>
        <View style={styles.heading}>
          <IconButton
            icon={ArrowLeft}
            accessibilityLabel={t('navigation.back')}
            onPress={() =>
              journey ? journey.close() : router.navigate('/home')
            }
          />
          <Text variant="title2" accessibilityRole="header">
            {t('navigation.cashback')}
          </Text>
        </View>
        <View
          ref={card}
          collapsable={false}
          onLayout={arrive}
          style={{ opacity: journey?.active ? 0 : 1 }}
        >
          <PressSurface
            accessibilityLabel={t('walletMotion.details')}
            accessibilityState={{ expanded }}
            onPress={() => setExpanded((value) => !value)}
            contentStyle={styles.cardPress}
            spring
          >
            <WalletSurface pendingMinor={wallet.data?.pendingMinor}>
              {wallet.data ? (
                <Amount minor={wallet.data.balanceMinor} tone="inverse" />
              ) : wallet.isLoading ? (
                <Skeleton
                  width={layout.balanceSkeletonWidth}
                  height={layout.controlHeight}
                  accessibilityLabel={t('common.loading')}
                />
              ) : (
                <Text tone="inverse">{t('home.balanceUnavailable')}</Text>
              )}
            </WalletSurface>
          </PressSurface>
        </View>
        <WalletEntrance order={2}>
          <WalletDetails
            balanceMinor={wallet.data?.balanceMinor}
            pendingMinor={wallet.data?.pendingMinor}
            expanded={expanded}
            onToggle={() => setExpanded((value) => !value)}
          />
        </WalletEntrance>
        {wallet.isError && (
          <Text style={styles.error} accessibilityRole="alert">
            {t('wallet.loadError')}
          </Text>
        )}
        {wallet.isError && (
          <Button
            label={t('common.retry')}
            onPress={() => {
              void wallet.refetch();
            }}
            loading={wallet.isFetching}
          />
        )}
      </View>
      <View style={styles.ledgerHeading}>
        <Text variant="title2" accessibilityRole="header">
          {t('visual.history')}
        </Text>
        <MockDataNotice />
      </View>
    </>
  );
  return (
    <Screen
      scroll={false}
      surface="wallet"
      edges={['top', 'left', 'right']}
      contentStyle={styles.screen}
    >
      <FlashList
        data={grouped.rows}
        keyExtractor={(item) => item.key}
        getItemType={(item) => item.kind}
        stickyHeaderIndices={grouped.stickyHeaderIndices}
        ListHeaderComponent={header}
        contentContainerStyle={styles.list}
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
        onEndReached={() => {
          void next();
        }}
        renderItem={({ item, index }) =>
          item.kind === 'date' ? (
            <View style={styles.date}>
              <Text
                variant="caption"
                tone="secondary"
                accessibilityRole="header"
              >
                {item.label}
              </Text>
            </View>
          ) : (
            <View style={styles.transaction}>
              <WalletEntrance order={Math.min(index + 3, 7)}>
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
              </WalletEntrance>
            </View>
          )
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            {history.isLoading ? (
              Array.from({ length: 6 }, (_, index) => (
                <DetailRowSkeleton key={index} />
              ))
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
              <EmptyState
                icon={Wallet}
                title={t('wallet.emptyTitle')}
                message={t('wallet.emptyBody')}
                action={{
                  label: t('home.scan'),
                  onPress: () => router.push('/scan'),
                }}
              />
            )}
          </View>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            {history.isError && history.data && (
              <Text tone="danger" accessibilityRole="alert">
                {t('wallet.loadError')}
              </Text>
            )}
            {history.hasNextPage || (history.isError && history.data) ? (
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
                <Text variant="caption" tone="secondary">
                  {t('wallet.end')}
                </Text>
              )
            )}
          </View>
        }
      />
    </Screen>
  );
}
const styles = StyleSheet.create({
  screen: { padding: 0, gap: 0 },
  list: { backgroundColor: colors.surface },
  hero: {
    backgroundColor: w.colors.canvas,
    padding: spacing[20],
    paddingTop: spacing[8],
    gap: spacing[12],
    paddingBottom: spacing[32],
  },
  heading: { flexDirection: 'row', alignItems: 'center', gap: spacing[12] },
  cardPress: { alignItems: 'stretch' },
  error: { color: w.colors.text },
  ledgerHeading: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing[20],
    paddingTop: spacing[20],
    gap: spacing[8],
  },
  date: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing[20],
    paddingTop: spacing[20],
    paddingBottom: spacing[4],
  },
  transaction: { paddingHorizontal: spacing[20] },
  empty: { paddingHorizontal: spacing[20] },
  footer: {
    backgroundColor: colors.surface,
    padding: spacing[20],
    gap: spacing[12],
  },
});
