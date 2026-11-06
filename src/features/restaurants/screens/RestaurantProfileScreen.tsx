import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import { Screen } from '@/components/ui/Screen';
import { IconButton } from '@/components/ui/IconButton';
import { Text } from '@/components/ui/Text';
import { PressSurface } from '@/components/ui/PressSurface';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Skeleton } from '@/components/feedback/Skeleton';
import { colors, layout, radius, spacing } from '@/design';
import { premium } from '@/design/premium';
import { services } from '@/services';
import { safeIdSchema } from '@/lib/deep-link';
import { useCatalog } from '../catalog';
import { FoodImage } from '@/components/food/FoodImage';
import { MenuDish } from '../components/MenuDish';

export default function RestaurantProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const valid = typeof id === 'string' && safeIdSchema.safeParse(id).success;
  const query = useQuery({
    queryKey: ['restaurant', 'detail', id],
    queryFn: () => services.restaurant.get(id),
    enabled: valid,
  });
  const catalog = useCatalog(valid ? id : '');
  const { t } = useTranslation();
  const router = useRouter();
  const [section, setSection] = useState('');
  const width =
    Math.min(useWindowDimensions().width, layout.contentMaxWidth) -
    spacing[20] * 2;
  const dishes =
    catalog.data?.dishes.filter((d) => !section || d.sectionKey === section) ??
    [];
  const header = (
    <View style={styles.header}>
      <View style={styles.top}>
        <IconButton
          icon={ArrowLeft}
          accessibilityLabel={t('navigation.back')}
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace('/restaurants')
          }
        />
        <Text variant="caption" tone="secondary">
          {t('premium.restaurantProfile')}
        </Text>
      </View>
      <FoodImage
        photo={catalog.data?.cover}
        uri={query.data?.logoUrl}
        width={width}
        height={premium.dishHeight}
      />
      <Text variant="caption" style={styles.accent}>
        {t(catalog.data?.cuisineKey ?? 'visual.partner')}
      </Text>
      <Text variant="title1" accessibilityRole="header">
        {query.data?.name}
      </Text>
      {query.data && (
        <Text tone="secondary">
          {t('restaurants.branches', { count: query.data.branchCount })}
        </Text>
      )}
      {catalog.data && (
        <Text variant="caption" tone="secondary">
          {t('premium.sampleMenu')}
        </Text>
      )}
      <View style={styles.menuTitle}>
        <Text variant="title2" accessibilityRole="header">
          {t('premium.menu')}
        </Text>
        <Text variant="caption" tone="secondary">
          {t('premium.purchaseOnly')}
        </Text>
      </View>
      {catalog.data && (
        <View style={styles.sections}>
          {['', ...new Set(catalog.data.dishes.map((d) => d.sectionKey))].map(
            (key) => (
              <PressSurface
                key={key}
                accessibilityLabel={t(key || 'premium.all')}
                accessibilityState={{ selected: section === key }}
                onPress={() => setSection(key)}
                contentStyle={[styles.chip, section === key && styles.active]}
              >
                <Text
                  variant="caption"
                  style={{
                    color:
                      section === key ? colors.surface : colors.inkSecondary,
                  }}
                >
                  {t(key || 'premium.all')}
                </Text>
              </PressSurface>
            ),
          )}
        </View>
      )}
    </View>
  );
  return (
    <Screen
      scroll={false}
      edges={['top', 'left', 'right']}
      contentStyle={styles.screen}
    >
      <FlashList
        data={dishes}
        numColumns={2}
        keyExtractor={(d) => d.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={header}
        renderItem={({ item, index }) => (
          <View
            style={{
              paddingLeft: index % 2 ? spacing[8] : 0,
              paddingRight: index % 2 ? 0 : spacing[8],
            }}
          >
            <MenuDish
              dish={item}
              width={(width - spacing[16]) / 2}
              onPress={() =>
                router.push({
                  pathname: '/restaurant/[id]/dish/[dishId]',
                  params: { id, dishId: item.id },
                })
              }
            />
          </View>
        )}
        ListEmptyComponent={
          query.isLoading || catalog.isLoading ? (
            <Skeleton
              width="100%"
              height={premium.heroHeight}
              accessibilityLabel={t('common.loading')}
            />
          ) : query.isError || !valid ? (
            <ErrorState
              title={t('product.loadError')}
              retryLabel={t('common.retry')}
              onRetry={() => {
                void query.refetch();
              }}
            />
          ) : (
            <Text tone="secondary">{t('premium.menuUnavailable')}</Text>
          )
        }
      />
    </Screen>
  );
}
const styles = StyleSheet.create({
  screen: { padding: 0, gap: 0 },
  list: { padding: spacing[20] },
  header: { gap: spacing[16], paddingBottom: spacing[20] },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing[8] },
  accent: { color: colors.brand.accent },
  menuTitle: { gap: spacing[8], paddingTop: spacing[12] },
  sections: { flexDirection: 'row', gap: spacing[8], flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: spacing[16],
    minHeight: layout.tapTarget,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  active: { backgroundColor: colors.brand.primary },
});
