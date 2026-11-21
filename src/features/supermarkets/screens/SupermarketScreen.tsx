import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import Search from 'lucide-react-native/icons/search';
import X from 'lucide-react-native/icons/x';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { Text } from '@/components/ui/Text';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { DetailRowSkeleton } from '@/components/feedback/DetailRowSkeleton';
import { colors, layout, radius, spacing, typography } from '@/design';
import { premium } from '@/design/premium';
import { safeIdSchema } from '@/lib/deep-link';
import {
  filterShelf,
  shelfFor,
  useRetailCatalog,
  type ProductSort,
  type RetailCategory,
  type ShelfItem,
} from '../retail';
import { ProductRow, StoreBanner } from '../components/RetailParts';

const sorts: ProductSort[] = ['rating', 'reviews', 'name'];

export default function SupermarketScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const valid = safeIdSchema.safeParse(id).success;
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const top = useSafeAreaInsets().top;
  const catalog = useRetailCatalog();
  const store = catalog.data?.supermarkets.find((s) => s.id === id);
  // State lives in this mounted screen, so search, filters and scroll survive
  // opening a product and coming back.
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<RetailCategory | null>(null);
  const [topRated, setTopRated] = useState(false);
  const [ownBrand, setOwnBrand] = useState(false);
  const [sort, setSort] = useState<ProductSort>('rating');
  const shelf = useMemo(
    () => (catalog.data && valid ? shelfFor(catalog.data, id) : []),
    [catalog.data, valid, id],
  );
  // Warm the cache for the first screenful so packshots appear without a gap.
  useEffect(() => {
    const urls = shelf
      .slice(0, 12)
      .map((s) => s.product.imageUrl)
      .filter((u): u is string => Boolean(u));
    if (urls.length) void Image.prefetch(urls, 'memory-disk');
  }, [shelf]);
  const categories = useMemo(
    () => [...new Set(shelf.map((s) => s.product.category))],
    [shelf],
  );
  const items = useMemo(
    () =>
      filterShelf(
        ownBrand ? shelf.filter((s) => s.product.privateLabel) : shelf,
        {
          query,
          category,
          minRating: topRated ? 4 : null,
          sort,
          categoryLabel: (c) => t(`retail.category.${c}`),
          locale: i18n.language,
        },
      ),
    [shelf, ownBrand, query, category, topRated, sort, t, i18n.language],
  );
  const open = useCallback(
    (productId: string) =>
      router.push({
        pathname: '/supermarket/[id]/product/[productId]',
        params: { id, productId },
      }),
    [router, id],
  );
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ShelfItem>) => (
      <ProductRow item={item} onPress={open} />
    ),
    [open],
  );
  const back = (
    <View style={[styles.back, { top: top + spacing[8] }]}>
      <IconButton
        icon={ArrowLeft}
        tone="inverse"
        accessibilityLabel={t('navigation.back')}
        onPress={() =>
          router.canGoBack() ? router.back() : router.replace('/supermarkets')
        }
      />
    </View>
  );
  const header = store ? (
    <View>
      <StoreBanner
        store={store}
        height={premium.storeBanner + top + spacing[24]}
        overlap={premium.sheetOverlap}
      >
        {back}
      </StoreBanner>
      <View style={styles.sheet}>
        <View style={styles.block}>
          <View style={styles.titleRow}>
            <Text
              variant="title1"
              accessibilityRole="header"
              style={styles.flex}
            >
              {store.name}
            </Text>
          </View>
          <Text tone="secondary">{store.description}</Text>
        </View>
        <View style={styles.search}>
          <Icon icon={Search} decorative />
          <TextInput
            value={query}
            onChangeText={setQuery}
            accessibilityLabel={t('retail.searchProducts')}
            placeholder={t('retail.searchProducts')}
            placeholderTextColor={colors.inkSecondary}
            maxLength={100}
            autoCorrect={false}
            returnKeyType="search"
            style={styles.input}
          />
          {query.length > 0 && (
            <IconButton
              icon={X}
              accessibilityLabel={t('restaurants.clear')}
              onPress={() => setQuery('')}
            />
          )}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.rail}
          contentContainerStyle={styles.chips}
        >
          <Chip
            label={t('retail.allCategories')}
            tone="brand"
            selected={category === null}
            onPress={() => setCategory(null)}
          />
          {categories.map((c) => (
            <Chip
              key={c}
              label={t(`retail.category.${c}`)}
              tone="brand"
              selected={category === c}
              onPress={() => setCategory(category === c ? null : c)}
            />
          ))}
        </ScrollView>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.rail}
          contentContainerStyle={styles.chips}
        >
          {sorts.map((s) => (
            <Chip
              key={s}
              label={t(`retail.sort.${s}`)}
              selected={sort === s}
              onPress={() => setSort(s)}
            />
          ))}
          <Chip
            label={t('retail.fourPlus')}
            selected={topRated}
            onPress={() => setTopRated((v) => !v)}
          />
          {shelf.some((s) => s.product.privateLabel) && (
            <Chip
              label={t('retail.ownBrands')}
              selected={ownBrand}
              onPress={() => setOwnBrand((v) => !v)}
            />
          )}
        </ScrollView>
        <Text
          variant="caption"
          tone="secondary"
          accessibilityLiveRegion="polite"
        >
          {t('retail.showing', { count: items.length })}
        </Text>
      </View>
    </View>
  ) : (
    <View style={[styles.plain, { paddingTop: top + spacing[8] }]}>
      <IconButton
        icon={ArrowLeft}
        accessibilityLabel={t('navigation.back')}
        onPress={() =>
          router.canGoBack() ? router.back() : router.replace('/supermarkets')
        }
      />
    </View>
  );
  return (
    <View style={styles.root}>
      <StatusBar style={store ? 'light' : 'dark'} />
      <View style={styles.column}>
        <FlashList
          data={items}
          renderItem={renderItem}
          keyExtractor={(i) => i.product.id}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={styles.list}
          ListHeaderComponent={header}
          ListEmptyComponent={
            catalog.isPending ? (
              <View style={styles.pad} accessibilityLabel={t('common.loading')}>
                {Array.from({ length: 4 }, (_, i) => (
                  <DetailRowSkeleton key={i} />
                ))}
              </View>
            ) : catalog.isError ? (
              <ErrorState
                title={t('product.loadError')}
                retryLabel={t('common.retry')}
                onRetry={() => void catalog.refetch()}
              />
            ) : !store ? (
              <EmptyState icon={Search} title={t('retail.storeMissing')} />
            ) : shelf.length === 0 ? (
              <EmptyState
                icon={Search}
                title={t('retail.noVerifiedTitle')}
                message={t('retail.noVerifiedBody')}
              />
            ) : (
              <EmptyState
                icon={Search}
                title={t('retail.noProducts')}
                message={t('restaurants.tryAnother')}
              />
            )
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
  },
  list: { paddingBottom: spacing[48] },
  back: { position: 'absolute', left: spacing[8] },
  plain: { paddingHorizontal: spacing[8] },
  sheet: {
    marginTop: -premium.sheetOverlap,
    borderTopLeftRadius: premium.sheetRadius,
    borderTopRightRadius: premium.sheetRadius,
    backgroundColor: colors.surface,
    paddingTop: spacing[24],
    paddingHorizontal: spacing.screenMargin,
    paddingBottom: spacing[8],
    gap: spacing[16],
  },
  block: { gap: spacing[8] },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[12] },
  flex: { flex: 1, minWidth: 0 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
    minHeight: layout.searchHeight,
    paddingHorizontal: spacing[12],
    backgroundColor: premium.canvas,
    borderRadius: radius[16],
  },
  input: {
    ...typography.body,
    flex: 1,
    minWidth: 0,
    minHeight: layout.searchHeight,
    color: colors.ink,
  },
  rail: { marginHorizontal: -spacing.screenMargin },
  chips: { gap: spacing[8], paddingHorizontal: spacing.screenMargin },
  pad: { padding: spacing.screenMargin },
});
