import { useCallback, useRef, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlashList } from '@shopify/flash-list';
import { StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  ReduceMotion,
} from 'react-native-reanimated';
import ReceiptText from 'lucide-react-native/icons/receipt-text';
import SearchIcon from 'lucide-react-native/icons/search';
import X from 'lucide-react-native/icons/x';
import { Screen } from '@/components/ui/Screen';
import { BackButton } from '@/components/navigation/BackButton';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { PressSurface } from '@/components/ui/PressSurface';
import { Text } from '@/components/ui/Text';
import { EmptyState } from '@/components/feedback/EmptyState';
import { DetailRowSkeleton } from '@/components/feedback/DetailRowSkeleton';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { useBills } from '@/hooks/useReceiptLibrary';
import { useDebouncedSearch } from '@/hooks/useDebouncedSearch';
import { BillRow } from '@/components/receipts/BillRow';
import {
  activeFilterCount,
  billParams,
  noBillFilters,
  type BillFilters,
} from '@/hooks/billFilters';
import { billMonth } from '@/hooks/billView';
import { colors, radius, spacing } from '@/design';
import { originalReceipts as o } from '@/design/original-receipts';
import type { Receipt } from '@/services/contracts';
import { BillFilterPanel } from '../components/BillFilterPanel';
import { BillSearch } from '../components/BillSearch';

type Entry =
  | { kind: 'month'; key: string; label: string }
  | { kind: 'bill'; key: string; receipt: Receipt; order: number };

/** The list as a memory of visits: a heading wherever the month changes. */
function byMonth(receipts: readonly Receipt[], language: string): Entry[] {
  const thisYear = new Date().getFullYear();
  const entries: Entry[] = [];
  let current = '';
  receipts.forEach((receipt, order) => {
    const month = billMonth(receipt.issuedAt);
    if (month !== current) {
      current = month;
      const date = new Date(receipt.issuedAt);
      entries.push({
        kind: 'month',
        // A server page can return to an earlier month: keys stay unique.
        key: `${month}/${receipt.id}`,
        label: new Intl.DateTimeFormat(language, {
          month: 'long',
          ...(date.getFullYear() === thisYear ? {} : { year: 'numeric' }),
        }).format(date),
      });
    }
    entries.push({ kind: 'bill', key: receipt.id, receipt, order });
  });
  return entries;
}

export function BillsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [input, setInput] = useState('');
  const [filters, setFilters] = useState(noBillFilters);
  const [open, setOpen] = useState(false);
  const search = useDebouncedSearch(input);
  // Date presets are relative to when the screen opened.
  const [openedAt] = useState(() => Date.now());
  const params = billParams(search, filters, openedAt);
  const bills = useBills(params);
  const active = activeFilterCount(filters);
  const narrowed = Object.keys(params).length > 0;
  const tags = (
    [
      [
        'date',
        {
          any: '',
          week: t('bills.week'),
          month: t('bills.month'),
          custom: `${filters.from} – ${filters.to}`,
        }[filters.date],
      ],
      [
        'partner',
        { any: '', yes: t('bills.partnerYes'), no: t('bills.partnerNo') }[
          filters.partner
        ],
      ],
      [
        'cashback',
        {
          any: '',
          eligible: t('bills.cashbackTagYes'),
          none: t('bills.cashbackTagNo'),
        }[filters.cashback],
      ],
    ] satisfies [keyof BillFilters, string][]
  ).filter(([, label]) => label);
  const reset = () => {
    setInput('');
    setFilters(noBillFilters);
  };
  const locked = useRef(false);
  useFocusEffect(
    useCallback(() => {
      locked.current = false;
    }, []),
  );
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
      <View style={styles.controls}>
        <BillSearch
          value={input}
          onChange={setInput}
          activeFilters={active}
          onFilters={() => setOpen(true)}
        />
        {narrowed && (
          <Animated.View
            entering={FadeIn.duration(180).reduceMotion(ReduceMotion.System)}
            exiting={FadeOut.duration(120).reduceMotion(ReduceMotion.System)}
            style={styles.tags}
          >
            {tags.map(([key, label]) => (
              <PressSurface
                key={key}
                accessibilityLabel={t('bills.removeFilter', { name: label })}
                onPress={() => setFilters({ ...filters, [key]: 'any' })}
                style={styles.tag}
                contentStyle={styles.tagContent}
              >
                <Text style={styles.tagText}>{label}</Text>
                <Icon
                  icon={X}
                  size="small"
                  color={colors.brand.primary}
                  decorative
                />
              </PressSurface>
            ))}
            <View>
              <Button
                variant="ghost"
                label={t('bills.reset')}
                onPress={reset}
              />
            </View>
          </Animated.View>
        )}
      </View>
      {open && (
        <BillFilterPanel
          filters={filters}
          onChange={setFilters}
          onClose={() => setOpen(false)}
        />
      )}
      <FlashList
        data={byMonth(bills.receipts, i18n.language)}
        keyExtractor={(item) => item.key}
        getItemType={(item) => item.kind}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) =>
          item.kind === 'month' ? (
            <Text style={styles.month} accessibilityRole="header">
              {item.label}
            </Text>
          ) : (
            <BillRow
              receipt={item.receipt}
              order={item.order}
              onPress={() => {
                if (!locked.current) {
                  locked.current = true;
                  router.push({
                    pathname: '/receipt/[receiptId]',
                    params: { receiptId: item.receipt.id },
                  });
                }
              }}
            />
          )
        }
        refreshControl={
          <PullToRefresh
            refreshing={bills.isRefetching}
            onRefresh={() => {
              void bills.refetch();
            }}
          />
        }
        ListEmptyComponent={
          bills.isPending ? (
            <DetailRowSkeleton />
          ) : bills.isError ? null : narrowed ? (
            <EmptyState
              icon={SearchIcon}
              title={t('bills.noMatches')}
              message={t('bills.noMatchesBody')}
            />
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
            {bills.isError && (
              <>
                <Text accessibilityRole="alert">
                  {t('receipt.unavailable')}
                </Text>
                <Button
                  label={t('common.retry')}
                  onPress={() => {
                    void bills.refetch();
                  }}
                />
              </>
            )}
            {bills.hasNextPage && (
              <Button
                label={t('product.loadMore')}
                loading={bills.isFetchingNextPage}
                onPress={() => {
                  void bills.fetchNextPage();
                }}
              />
            )}
          </>
        }
      />
    </Screen>
  );
}
const styles = StyleSheet.create({
  controls: { gap: spacing[8], paddingBottom: spacing[8] },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing[8],
  },
  tag: {
    borderRadius: radius.pill,
    backgroundColor: colors.brand.tint,
    overflow: 'hidden',
  },
  tagContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    paddingHorizontal: spacing[12],
  },
  tagText: {
    ...o.type.caption,
    fontWeight: '700',
    color: colors.brand.primary,
  },
  month: {
    ...o.type.product,
    color: o.colors.secondary,
    textTransform: 'capitalize',
    paddingTop: spacing[8],
    paddingBottom: spacing[12],
  },
});
