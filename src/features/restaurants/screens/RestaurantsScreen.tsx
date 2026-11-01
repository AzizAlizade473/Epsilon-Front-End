import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import Store from 'lucide-react-native/icons/store';
import Search from 'lucide-react-native/icons/search';
import X from 'lucide-react-native/icons/x';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '@/components/ui/Header';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { MockDataNotice } from '@/components/feedback/MockDataNotice';
import { DetailRowSkeleton } from '@/components/feedback/DetailRowSkeleton';
import { colors, layout, radius, spacing, typography } from '@/design';
import { useStaleRefetchOnFocus } from '@/hooks/useStaleRefetchOnFocus';
import type { Restaurant } from '@/services/contracts';
import { queryKeys } from '@/services/query';
import { RestaurantRow } from '../components/RestaurantRow';
import { useRestaurants, useRestaurantSearch } from '../hooks/useRestaurants';

const renderItem = ({ item }: ListRenderItemInfo<Restaurant>) => (
  <RestaurantRow restaurant={item} />
);
const keyExtractor = (item: Restaurant) => item.id;
const maintainPosition = { disabled: true };
export default function RestaurantsScreen() {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const search = useRestaurantSearch(input);
  const query = useRestaurants(search);
  useStaleRefetchOnFocus(queryKeys.restaurant.all);
  const [collapsed, setCollapsed] = useState(false);
  const collapsedRef = useRef(false);
  const titleHeight = useRef<number>(typography.title1.lineHeight);
  const nextLocked = useRef(false);
  const [pulling, setPulling] = useState(false);
  const pullLocked = useRef(false);
  const waiting = input.trim() !== search;
  const next = useCallback(async () => {
    if (!query.hasNextPage || query.isFetching || nextLocked.current || waiting)
      return;
    nextLocked.current = true;
    try {
      await query.fetchNextPage();
    } finally {
      nextLocked.current = false;
    }
  }, [query, waiting]);
  const refresh = async () => {
    if (pullLocked.current) return;
    pullLocked.current = true;
    setPulling(true);
    try {
      await query.refetch();
    } finally {
      pullLocked.current = false;
      setPulling(false);
    }
  };
  const header = (
    <View style={styles.header}>
      <View
        accessibilityElementsHidden={collapsed}
        importantForAccessibility={collapsed ? 'no-hide-descendants' : 'auto'}
      >
        <Text
          variant="title1"
          accessibilityRole="header"
          onLayout={(event) => {
            titleHeight.current = event.nativeEvent.layout.height;
          }}
        >
          {t('navigation.restaurants')}
        </Text>
      </View>
      <View style={styles.search}>
        <Icon icon={Search} decorative />
        <TextInput
          value={input}
          onChangeText={setInput}
          accessibilityLabel={t('restaurants.search')}
          placeholder={t('restaurants.search')}
          placeholderTextColor={colors.inkSecondary}
          maxLength={100}
          autoCorrect={false}
          returnKeyType="search"
          allowFontScaling
          maxFontSizeMultiplier={0}
          style={styles.input}
        />
        {input.length > 0 && (
          <IconButton
            icon={X}
            accessibilityLabel={t('restaurants.clear')}
            onPress={() => setInput('')}
          />
        )}
      </View>
      <MockDataNotice />
      {query.isError &&
        query.items.length > 0 &&
        !query.isFetchNextPageError && (
          <View>
            <Text accessibilityRole="alert">{t('product.loadError')}</Text>
            <Button
              variant="ghost"
              label={t('common.retry')}
              onPress={() => {
                void query.refetch();
              }}
            />
          </View>
        )}
    </View>
  );
  const empty =
    waiting || query.isPending ? (
      <View
        style={styles.skeleton}
        accessibilityLabel={t('common.loading')}
        accessibilityRole="progressbar"
      >
        {Array.from({ length: 5 }, (_, index) => (
          <DetailRowSkeleton key={index} />
        ))}
      </View>
    ) : query.isError ? (
      <ErrorState
        title={t('product.loadError')}
        retryLabel={t('common.retry')}
        loading={query.isFetching}
        onRetry={() => {
          void query.refetch();
        }}
      />
    ) : search ? (
      <EmptyState
        icon={Search}
        title={t('restaurants.noResults')}
        message={t('restaurants.tryAnother')}
      />
    ) : (
      <EmptyState icon={Store} title={t('restaurants.empty')} />
    );
  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <Header title={t('navigation.restaurants')} titleVisible={collapsed} />
      <View style={styles.column}>
        <FlashList
          data={waiting ? [] : query.items}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          maintainVisibleContentPosition={maintainPosition}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={styles.content}
          ListHeaderComponent={header}
          ListEmptyComponent={empty}
          refreshing={pulling}
          refreshControl={
            <PullToRefresh
              refreshing={pulling}
              onRefresh={() => {
                void refresh();
              }}
            />
          }
          onRefresh={() => {
            void refresh();
          }}
          onEndReachedThreshold={0.25}
          onEndReached={() => {
            if (!query.isFetchNextPageError) void next();
          }}
          scrollEventThrottle={spacing[16]}
          onScroll={(event) => {
            const nextCollapsed =
              event.nativeEvent.contentOffset.y >=
              titleHeight.current + spacing[16];
            if (nextCollapsed !== collapsedRef.current) {
              collapsedRef.current = nextCollapsed;
              setCollapsed(nextCollapsed);
            }
          }}
          ListFooterComponent={
            query.hasNextPage && !waiting ? (
              <View style={styles.footer}>
                {query.isFetchNextPageError && (
                  <Text accessibilityRole="alert">
                    {t('product.loadError')}
                  </Text>
                )}
                <Button
                  variant="ghost"
                  label={t(
                    query.isFetchNextPageError
                      ? 'common.retry'
                      : 'product.loadMore',
                  )}
                  loading={query.isFetchingNextPage}
                  disabled={query.isFetching && !query.isFetchingNextPage}
                  onPress={() => {
                    void next();
                  }}
                />
              </View>
            ) : null
          }
        />
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
  },
  content: {
    paddingHorizontal: spacing.screenMargin,
    paddingBottom: spacing[20],
  },
  header: { gap: spacing[16], paddingVertical: spacing[20] },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
    minHeight: layout.searchHeight,
    paddingHorizontal: spacing[12],
    backgroundColor: colors.surface,
    borderWidth: layout.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.pill,
  },
  input: {
    ...typography.body,
    flex: 1,
    minWidth: 0,
    minHeight: layout.searchHeight,
    color: colors.ink,
    paddingVertical: spacing[8],
  },
  skeleton: { gap: 0 },
  footer: { gap: spacing[8], paddingTop: spacing[16] },
});
