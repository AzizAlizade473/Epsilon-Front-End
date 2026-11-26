import { useCallback, useRef, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlashList } from '@shopify/flash-list';
import { StyleSheet, View } from 'react-native';
import ReceiptText from 'lucide-react-native/icons/receipt-text';
import SearchIcon from 'lucide-react-native/icons/search';
import X from 'lucide-react-native/icons/x';
import { Screen } from '@/components/ui/Screen';
import { BackButton } from '@/components/navigation/BackButton';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { IconButton } from '@/components/ui/IconButton';
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
} from '@/hooks/billFilters';
import { spacing } from '@/design';
import { BillFilterPanel } from '../components/BillFilterPanel';

export function BillsScreen() {
  const { t } = useTranslation();
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
      <View style={styles.search}>
        <View style={styles.field}>
          <Input
            label={t('bills.search')}
            value={input}
            onChangeText={setInput}
            maxLength={80}
            autoCorrect={false}
            returnKeyType="search"
            appearance="underline"
            leading={<SearchIcon size={spacing[20]} />}
          />
        </View>
        {input.length > 0 && (
          <IconButton
            icon={X}
            accessibilityLabel={t('bills.clearSearch')}
            onPress={() => setInput('')}
          />
        )}
      </View>
      <View style={styles.actions}>
        <Button
          variant="ghost"
          label={
            active
              ? t('bills.filtersActive', { count: active })
              : t('bills.filters')
          }
          onPress={() => setOpen((value) => !value)}
        />
        {narrowed && (
          <Button variant="ghost" label={t('bills.reset')} onPress={reset} />
        )}
      </View>
      <FlashList
        data={bills.receipts}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={
          open ? (
            <BillFilterPanel filters={filters} onChange={setFilters} />
          ) : null
        }
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
  search: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing[4] },
  field: { flex: 1 },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});
