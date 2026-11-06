import { useRouter } from 'expo-router';
import ArrowUpRight from 'lucide-react-native/icons/arrow-up-right';
import MapPin from 'lucide-react-native/icons/map-pin';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { PressSurface } from '@/components/ui/PressSurface';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { colors, layout, radius, spacing } from '@/design';
import { premium } from '@/design/premium';
import type { Restaurant } from '@/services/contracts';
import { useCatalog } from '../catalog';
import { FoodImage } from '@/components/food/FoodImage';

export function RestaurantRow({ restaurant }: { restaurant: Restaurant }) {
  const { t } = useTranslation();
  const router = useRouter();
  const catalog = useCatalog(restaurant.id);
  const { width } = useWindowDimensions();
  const imageWidth =
    Math.min(width, layout.contentMaxWidth) - spacing.screenMargin * 2;
  const branches = t('restaurants.branches', { count: restaurant.branchCount });
  return (
    <PressSurface
      accessibilityLabel={`${restaurant.name}, ${branches}`}
      onPress={() =>
        router.push({
          pathname: '/restaurant/[id]',
          params: { id: restaurant.id },
        })
      }
      style={styles.card}
      contentStyle={styles.content}
      spring
    >
      <FoodImage
        photo={catalog.data?.cover}
        uri={restaurant.logoUrl}
        width={imageWidth}
        height={premium.heroHeight}
        rounded={false}
      />
      <View style={styles.info}>
        <View style={styles.copy}>
          <Text variant="caption" style={styles.cuisine}>
            {t(catalog.data?.cuisineKey ?? 'visual.partner')}
          </Text>
          <Text variant="title2">{restaurant.name}</Text>
          <View style={styles.location}>
            <Icon
              icon={MapPin}
              size="small"
              color={colors.inkSecondary}
              decorative
            />
            <Text variant="caption" tone="secondary">
              {branches}
            </Text>
          </View>
        </View>
        <View style={styles.arrow}>
          <Icon icon={ArrowUpRight} color={colors.brand.primary} decorative />
        </View>
      </View>
    </PressSurface>
  );
}
const styles = StyleSheet.create({
  card: {
    ...premium.shadow,
    backgroundColor: colors.surface,
    borderRadius: radius[24],
    marginBottom: spacing[24],
    overflow: 'hidden',
  },
  content: { alignItems: 'stretch', justifyContent: 'flex-start' },
  info: {
    padding: spacing[20],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
  },
  copy: { flex: 1, gap: spacing[8], minWidth: 0 },
  cuisine: { color: colors.brand.accent },
  location: { flexDirection: 'row', gap: spacing[4], alignItems: 'center' },
  arrow: {
    width: layout.tapTarget,
    height: layout.tapTarget,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
