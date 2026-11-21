import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useCallback, useContext, useMemo, useState } from 'react';
import { BottomTabBarHeightContext } from 'expo-router/js-tabs';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Search from 'lucide-react-native/icons/search';
import Store from 'lucide-react-native/icons/store';
import X from 'lucide-react-native/icons/x';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { Text } from '@/components/ui/Text';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { DetailRowSkeleton } from '@/components/feedback/DetailRowSkeleton';
import { Reveal } from '@/components/ratings/Reveal';
import { colors, layout, radius, spacing, typography } from '@/design';
import {
  useRetailCatalog,
  type RetailCategory,
  type Supermarket,
} from '../retail';
import { SupermarketCard } from '../components/RetailParts';

type Card = {
  store: Supermarket;
  productCount: number;
  categories: RetailCategory[];
};

export default function SupermarketsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const catalog = useRetailCatalog();
  const [query, setQuery] = useState('');
  const tabBarHeight = useContext(BottomTabBarHeightContext) ?? 0;
  const cards = useMemo<Card[]>(() => {
    const data = catalog.data;
    if (!data) return [];
    return data.supermarkets.map((store) => {
      const ids = new Set(
        data.listings
          .filter((l) => l.supermarketId === store.id && l.status === 'listed')
          .map((l) => l.productId),
      );
      const categories = [
        ...new Set(
          data.products.filter((p) => ids.has(p.id)).map((p) => p.category),
        ),
      ];
      return { store, productCount: ids.size, categories };
    });
  }, [catalog.data]);
  const q = query.trim().toLocaleLowerCase(i18n.language);
  const visible = q
    ? cards.filter((c) =>
        c.store.name.toLocaleLowerCase(i18n.language).includes(q),
      )
    : cards;
  const open = useCallback(
    (id: string) =>
      router.push({ pathname: '/supermarket/[id]', params: { id } }),
    [router],
  );
  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<Card>) => (
      <Reveal order={index}>
        <SupermarketCard {...item} onPress={open} />
      </Reveal>
    ),
    [open],
  );
  const header = (
    <View style={styles.header}>
      <Text variant="title1" accessibilityRole="header">
        {t('navigation.supermarkets')}
      </Text>
      <Text tone="secondary">{t('retail.subtitle')}</Text>
      <View style={styles.search}>
        <Icon icon={Search} decorative />
        <TextInput
          value={query}
          onChangeText={setQuery}
          accessibilityLabel={t('retail.searchStores')}
          placeholder={t('retail.searchStores')}
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
    </View>
  );
  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <View style={styles.column}>
        <FlashList
          data={visible}
          renderItem={renderItem}
          keyExtractor={(c) => c.store.id}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={[
            styles.content,
            { paddingBottom: tabBarHeight + spacing[16] },
          ]}
          ListHeaderComponent={header}
          ListFooterComponent={
            catalog.data ? (
              <Text variant="caption" tone="secondary" style={styles.note}>
                {t('retail.demoNote')}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            catalog.isPending ? (
              <View accessibilityLabel={t('common.loading')}>
                {Array.from({ length: 3 }, (_, i) => (
                  <DetailRowSkeleton key={i} />
                ))}
              </View>
            ) : catalog.isError ? (
              <ErrorState
                title={t('product.loadError')}
                retryLabel={t('common.retry')}
                onRetry={() => void catalog.refetch()}
              />
            ) : catalog.data === null ? (
              <EmptyState
                icon={Store}
                title={t('retail.comingSoon')}
                message={t('retail.comingSoonBody')}
              />
            ) : (
              <EmptyState
                icon={Search}
                title={t('restaurants.noResults')}
                message={t('restaurants.tryAnother')}
              />
            )
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
  content: { paddingHorizontal: spacing.screenMargin },
  header: {
    gap: spacing[12],
    paddingTop: spacing[24],
    paddingBottom: spacing[20],
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
    minHeight: layout.searchHeight,
    paddingHorizontal: spacing[12],
    backgroundColor: colors.surface,
    borderWidth: layout.borderWidth,
    borderColor: colors.border,
    borderRadius: radius[16],
    marginTop: spacing[4],
  },
  input: {
    ...typography.body,
    flex: 1,
    minWidth: 0,
    minHeight: layout.searchHeight,
    color: colors.ink,
  },
  note: { paddingVertical: spacing[16] },
});
