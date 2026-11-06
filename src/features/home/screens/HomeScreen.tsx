import { useCallback, useRef, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import Bell from 'lucide-react-native/icons/bell';
import ScanLine from 'lucide-react-native/icons/scan-line';
import ArrowUpRight from 'lucide-react-native/icons/arrow-up-right';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Brand } from '@/components/ui/Brand';
import { WalletSurface } from '@/components/wallet/WalletSurface';
import {
  useWalletJourney,
  type WalletCardRef,
} from '@/components/wallet/WalletJourney';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { PressSurface } from '@/components/ui/PressSurface';
import { PhoneVerificationBanner } from '@/components/feedback/PhoneVerificationBanner';
import { Text } from '@/components/ui/Text';
import { Skeleton } from '@/components/feedback/Skeleton';
import { DetailRowSkeleton } from '@/components/feedback/DetailRowSkeleton';
import { MockDataNotice } from '@/components/feedback/MockDataNotice';
import { BalanceAmount } from '@/components/wallet/BalanceAmount';
import { TransactionRow } from '@/components/wallet/TransactionRow';
import { colors, layout, radius, spacing } from '@/design';
import { premium } from '@/design/premium';
import { useStaleRefetchOnFocus } from '@/hooks/useStaleRefetchOnFocus';
import { useWallet, useWalletTransactions } from '@/hooks/useWallet';
import { useAuth } from '@/providers/AuthProvider';
import { queryKeys } from '@/services/query';
import { BillsSection } from '@/components/receipts/BillsSection';
import { WaitingDishes } from '../components/WaitingDishes';
import { StaggeredRow } from '../components/StaggeredRow';

export default function HomeScreen() {
  const { t } = useTranslation();
  const auth = useAuth();
  const router = useRouter();
  const wallet = useWallet();
  const journey = useWalletJourney();
  const walletCard = useRef<WalletCardRef>(null);
  const transactions = useWalletTransactions({ limit: 3 });
  useStaleRefetchOnFocus(queryKeys.wallet.all);
  const locked = useRef(false);
  const refreshing = useRef(false);
  const [pulling, setPulling] = useState(false);
  useFocusEffect(
    useCallback(() => {
      locked.current = false;
    }, []),
  );
  const scan = () => {
    if (!locked.current) {
      locked.current = true;
      router.navigate('/scan');
    }
  };
  const refresh = async () => {
    if (refreshing.current) return;
    refreshing.current = true;
    setPulling(true);
    try {
      await Promise.all([wallet.refetch(), transactions.refetch()]);
    } finally {
      refreshing.current = false;
      setPulling(false);
    }
  };
  const minor = wallet.data?.balanceMinor;
  const speech =
    minor === undefined
      ? ''
      : t('home.balanceSpeech', {
          sign: minor < 0 ? t('wallet.minus') : '',
          manat: Math.trunc(Math.abs(minor) / 100),
          qepik: Math.abs(minor) % 100,
        });
  const receipts = transactions.data?.items.map((item) => item.receiptId) ?? [];
  return (
    <Screen
      surface="wallet"
      edges={['top', 'left', 'right']}
      contentStyle={styles.screen}
      refreshControl={
        <PullToRefresh
          testID="home-refresh"
          refreshing={pulling}
          onRefresh={() => {
            void refresh();
          }}
        />
      }
    >
      <View style={styles.hero}>
        <View style={styles.heading}>
          <Brand inverse />
          <IconButton
            icon={Bell}
            tone="inverse"
            accessibilityLabel={t('navigation.notifications')}
            onPress={() => router.push('/profile/notifications')}
          />
        </View>
        <View style={styles.greeting}>
          <Text variant="caption" style={styles.muted}>
            {t('premium.yourEpsilon')}
          </Text>
          <Text variant="title2" tone="inverse">
            {t('home.greeting', { firstName: auth.user?.firstName ?? '' })}
          </Text>
        </View>
        <PressSurface
          accessibilityLabel={t('navigation.cashback')}
          onPress={() =>
            journey
              ? journey.open(walletCard.current)
              : router.navigate('/cashback')
          }
          contentStyle={styles.walletPress}
          spring
        >
          <View
            ref={walletCard}
            onLayout={() => journey?.registerHome(walletCard.current)}
            collapsable={false}
            style={[styles.walletWidth, { opacity: journey?.active ? 0 : 1 }]}
          >
            <WalletSurface pendingMinor={wallet.data?.pendingMinor}>
              <View style={styles.balanceValue}>
                {minor !== undefined ? (
                  <BalanceAmount
                    minor={minor}
                    accessibilityLabel={speech}
                    inverse
                  />
                ) : wallet.isPending ? (
                  <Skeleton
                    width={layout.balanceSkeletonWidth}
                    height={layout.controlHeight}
                    accessibilityLabel={t('common.loading')}
                  />
                ) : (
                  <Text tone="inverse" accessibilityRole="alert">
                    {t('home.balanceUnavailable')}
                  </Text>
                )}
              </View>
            </WalletSurface>
          </View>
        </PressSurface>
        <PressSurface
          accessibilityLabel={t('premium.walletDetails')}
          onPress={() =>
            journey
              ? journey.open(walletCard.current)
              : router.navigate('/cashback')
          }
          contentStyle={styles.walletLink}
        >
          <Text variant="caption" tone="inverse">
            {t('premium.walletDetails')}
          </Text>
          <Icon
            icon={ArrowUpRight}
            size="small"
            color={colors.surface}
            decorative
          />
        </PressSurface>
        {wallet.isError && (
          <>
            <Text tone="inverse" accessibilityRole="alert">
              {t('product.loadError')}
            </Text>
            <Button
              variant="primary"
              label={t('common.retry')}
              loading={wallet.isFetching}
              onPress={() => {
                void wallet.refetch();
              }}
            />
          </>
        )}
      </View>
      <View style={styles.body}>
        <PressSurface
          accessibilityLabel={t('home.scan')}
          onPress={scan}
          contentStyle={styles.action}
          spring
        >
          <View style={styles.scanMark}>
            <Icon
              icon={ScanLine}
              color={colors.brand.primary}
              size="large"
              decorative
            />
          </View>
          <View style={styles.actionCopy}>
            <Text variant="headline">{t('home.scan')}</Text>
            <Text variant="caption" tone="secondary">
              {t('home.scanHelper')}
            </Text>
          </View>
          <Icon icon={ArrowUpRight} color={colors.brand.primary} decorative />
        </PressSurface>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text
              variant="title2"
              accessibilityRole="header"
              style={styles.sectionTitle}
            >
              {t('home.recent')}
            </Text>
            <PressSurface
              accessibilityLabel={t('home.viewAll')}
              onPress={() => router.navigate('/cashback')}
              contentStyle={styles.link}
            >
              <Text variant="callout" style={styles.linkLabel}>
                {t('home.viewAll')}
              </Text>
            </PressSurface>
          </View>
          {transactions.isPending && !transactions.data ? (
            Array.from({ length: 3 }, (_, index) => (
              <DetailRowSkeleton key={index} leadingSize={spacing[24]} />
            ))
          ) : transactions.data?.items.length === 0 ? (
            <Text>{t('home.noActivity')}</Text>
          ) : (
            transactions.data?.items.slice(0, 3).map((transaction, index) => (
              <StaggeredRow key={transaction.id} index={index}>
                <TransactionRow
                  transaction={transaction}
                  onPress={() =>
                    router.push({
                      pathname: '/cashback/transaction/[id]',
                      params: { id: transaction.id },
                    })
                  }
                />
              </StaggeredRow>
            ))
          )}
          {transactions.isError && (
            <>
              <Text accessibilityRole="alert">{t('product.loadError')}</Text>
              <Button
                variant="ghost"
                label={t('common.retry')}
                loading={transactions.isFetching}
                onPress={() => {
                  void transactions.refetch();
                }}
              />
            </>
          )}
        </View>
        <WaitingDishes receiptIds={receipts} />
        <BillsSection receiptIds={receipts} />
        <PhoneVerificationBanner />
        <MockDataNotice />
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  screen: { padding: 0, gap: 0 },
  hero: {
    backgroundColor: premium.night,
    padding: spacing[20],
    paddingBottom: spacing[32],
    gap: spacing[20],
  },
  heading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: { gap: spacing[8] },
  muted: { color: premium.nightText },
  walletPress: { alignItems: 'stretch' },
  walletWidth: { width: '100%' },
  balanceValue: { minHeight: layout.controlHeight, justifyContent: 'center' },
  walletLink: {
    flexDirection: 'row',
    gap: spacing[8],
    justifyContent: 'center',
  },
  body: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius[24],
    borderTopRightRadius: radius[24],
    marginTop: -spacing[12],
    padding: spacing[20],
    gap: spacing[32],
  },
  action: {
    flexDirection: 'row',
    gap: spacing[12],
    alignItems: 'center',
    padding: spacing[16],
    borderRadius: radius[20],
    backgroundColor: colors.brand.tint,
  },
  scanMark: {
    width: layout.tapTarget,
    height: layout.tapTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCopy: { flex: 1, gap: spacing[4] },
  section: { gap: spacing[12] },
  sectionHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { flexShrink: 1 },
  link: { paddingHorizontal: spacing[8] },
  linkLabel: { color: colors.brand.primary },
});
