import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import ShieldCheck from 'lucide-react-native/icons/shield-check';
import { Text } from '@/components/ui/Text';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Skeleton } from '@/components/feedback/Skeleton';
import { MockDataNotice } from '@/components/feedback/MockDataNotice';
import { colors, layout, radius, spacing, typography } from '@/design';
import { premium } from '@/design/premium';
import { useRestaurant } from '../hooks/useRestaurants';
import { LikeButton } from '@/components/likes/LikeButton';
import { dishLike, restaurantLike } from '@/hooks/likeTargets';
import { isApiError } from '@/services/http/errors';
import { safeIdSchema } from '@/lib/deep-link';
import { useCatalog, type Catalog, type CatalogDish } from '../catalog';
import { MenuDish } from '../components/MenuDish';
import { Hero, RoundButton } from '../components/Hero';
import { RatingBars, Stars } from '@/components/ratings/Ratings';
import { BrandBadge } from '@/components/brand/BrandBadge';
import { Reveal } from '@/components/ratings/Reveal';

type Row =
  | { type: 'category'; id: string; name: string }
  | { type: 'dish'; dish: CatalogDish };

function menuRows(catalog: Catalog | null | undefined, only: string | null) {
  if (!catalog) return [];
  return catalog.categories
    .filter((c) => !only || c.id === only)
    .flatMap<Row>((c) => {
      const dishes = catalog.dishes.filter((d) => d.categoryId === c.id);
      return dishes.length
        ? [
            { type: 'category', id: c.id, name: c.name },
            ...dishes.map((dish) => ({ type: 'dish' as const, dish })),
          ]
        : [];
    });
}

export default function RestaurantProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const valid = typeof id === 'string' && safeIdSchema.safeParse(id).success;
  const query = useRestaurant(id, valid);
  const name = query.data?.name;
  const gone = isApiError(query.error) && query.error.status === 404;
  const catalog = useCatalog(valid ? id : '');
  const { t } = useTranslation();
  const router = useRouter();
  const [category, setCategory] = useState<string | null>(null);
  const data = catalog.data;
  const rows = useMemo(() => menuRows(data, category), [data, category]);
  const open = useCallback(
    (dishId: string) =>
      router.push({
        pathname: '/restaurant/[id]/dish/[dishId]',
        params: { id, dishId },
      }),
    [router, id],
  );
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Row>) =>
      item.type === 'category' ? (
        <Text
          variant="headline"
          accessibilityRole="header"
          style={styles.category}
        >
          {item.name}
        </Text>
      ) : (
        <MenuDish
          dish={item.dish}
          onPress={open}
          like={dishLike(
            id,
            item.dish.id,
            item.dish.name,
            name ?? '',
            item.dish.imageUrl,
          )}
        />
      ),
    [open, id, name],
  );
  const back = (
    <RoundButton
      icon={ArrowLeft}
      label={t('navigation.back')}
      onPress={() =>
        router.canGoBack() ? router.back() : router.replace('/restaurants')
      }
    />
  );
  const header = (
    <View>
      <Hero
        uri={data?.coverUrl}
        height={premium.restaurantHero}
        leading={back}
        trailing={
          name ? (
            <LikeButton
              variant="overlay"
              target={restaurantLike(
                id,
                name,
                data?.district ?? '',
                data?.coverUrl,
              )}
            />
          ) : undefined
        }
      />
      <View style={styles.sheet}>
        <Reveal order={0} style={styles.block}>
          <View style={styles.titleRow}>
            {query.data && (
              <BrandBadge
                name={query.data.name}
                logoUrl={query.data.logoUrl}
                size={44}
                fallback={false}
              />
            )}
            <Text
              variant="title1"
              accessibilityRole="header"
              style={styles.title}
            >
              {query.data?.name ?? ' '}
            </Text>
          </View>
          {data && (
            <Text variant="caption" tone="secondary">
              {[
                t(`dining.cuisine.${data.cuisine}`),
                data.district,
                t('dining.dishes', { count: data.dishes.length }),
                query.data &&
                  t('restaurants.branches', { count: query.data.branchCount }),
              ]
                .filter(Boolean)
                .join('  ·  ')}
            </Text>
          )}
          {data && <Text tone="secondary">{data.about}</Text>}
        </Reveal>
        {data && (
          <Reveal order={1} style={styles.summary}>
            <View style={styles.big}>
              <Text style={styles.score}>{data.rating.average.toFixed(1)}</Text>
              <Stars value={data.rating.average} />
              <Text variant="caption" tone="secondary" style={styles.center}>
                {t('dining.ratings', { count: data.rating.count })}
              </Text>
            </View>
            <RatingBars rating={data.rating} />
          </Reveal>
        )}
        {data && (
          <Reveal order={2} style={styles.notice}>
            <Icon
              icon={ShieldCheck}
              size="small"
              color={colors.brand.accent}
              decorative
            />
            <Text variant="caption" style={styles.noticeText}>
              {t('dining.verifiedOnly')}
            </Text>
          </Reveal>
        )}
        <MockDataNotice />
        {data && (
          <View style={styles.block}>
            <Text variant="title2" accessibilityRole="header">
              {t('dining.menu')}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.rail}
              contentContainerStyle={styles.chips}
            >
              <Chip
                label={t('dining.allDishes', { count: data.dishes.length })}
                tone="brand"
                selected={category === null}
                onPress={() => setCategory(null)}
              />
              {data.categories.map((c) => (
                <Chip
                  key={c.id}
                  label={c.name}
                  tone="brand"
                  selected={category === c.id}
                  onPress={() => setCategory(category === c.id ? null : c.id)}
                />
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.column}>
        <FlashList
          data={rows}
          renderItem={renderItem}
          getItemType={(item) => item.type}
          keyExtractor={(item) =>
            item.type === 'category' ? `c_${item.id}` : item.dish.id
          }
          contentContainerStyle={styles.list}
          ListHeaderComponent={header}
          ListEmptyComponent={
            query.isLoading || catalog.isLoading ? (
              <View style={styles.pad}>
                <Skeleton
                  width="100%"
                  height={premium.menuThumb}
                  accessibilityLabel={t('common.loading')}
                />
              </View>
            ) : gone ? (
              <Text accessibilityRole="alert" style={styles.pad}>
                {t('likes.gone')}
              </Text>
            ) : query.isError || catalog.isError || !valid ? (
              <ErrorState
                title={t('product.loadError')}
                retryLabel={t('common.retry')}
                onRetry={() => {
                  void query.refetch();
                  void catalog.refetch();
                }}
              />
            ) : (
              <Text tone="secondary" style={styles.pad}>
                {t('premium.menuUnavailable')}
              </Text>
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
  sheet: {
    marginTop: -premium.sheetOverlap,
    borderTopLeftRadius: premium.sheetRadius,
    borderTopRightRadius: premium.sheetRadius,
    backgroundColor: colors.surface,
    paddingTop: spacing[24],
    paddingHorizontal: spacing.screenMargin,
    gap: spacing[20],
  },
  block: { gap: spacing[8] },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[12] },
  title: { flex: 1 },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[20],
    padding: spacing[16],
    borderRadius: radius[20],
    backgroundColor: premium.canvas,
  },
  big: { alignItems: 'center', gap: spacing[4], maxWidth: '40%' },
  score: { ...typography.display, color: colors.brand.primary },
  center: { textAlign: 'center' },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
    padding: spacing[12],
    borderRadius: radius[16],
    backgroundColor: colors.brand.tint,
  },
  noticeText: { flex: 1, color: colors.brand.accent },
  rail: { marginHorizontal: -spacing.screenMargin, marginTop: spacing[8] },
  chips: { gap: spacing[8], paddingHorizontal: spacing.screenMargin },
  category: {
    paddingHorizontal: spacing.screenMargin,
    paddingTop: spacing[24],
    paddingBottom: spacing[4],
    color: colors.brand.primary,
  },
  pad: { padding: spacing.screenMargin },
});
