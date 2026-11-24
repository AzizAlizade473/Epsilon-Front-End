import { useRouter } from 'expo-router';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Award from 'lucide-react-native/icons/award';
import { PressSurface } from '@/components/ui/PressSurface';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { colors, layout, radius, spacing } from '@/design';
import { premium } from '@/design/premium';
import type { Restaurant } from '@/services/contracts';
import type { DirectoryEntry } from '../catalog';
import { FoodImage } from '@/components/food/FoodImage';
import { BrandBadge } from '@/components/brand/BrandBadge';
import { ScoreLine } from '@/components/ratings/Ratings';

/** Directory card: leads with verified dish scores, not distance or maps. */
export const RestaurantRow = memo(function RestaurantRow({
  restaurant,
  entry,
}: {
  restaurant: Restaurant;
  entry?: DirectoryEntry;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const imageWidth =
    Math.min(width, layout.contentMaxWidth) - spacing.screenMargin * 2;
  const branches = t('restaurants.branches', { count: restaurant.branchCount });
  const meta = entry
    ? [
        t(`dining.cuisine.${entry.cuisine}`),
        entry.district,
        t('dining.dishes', { count: entry.dishCount }),
      ].join('  ·  ')
    : branches;
  return (
    <PressSurface
      accessibilityLabel={[
        restaurant.name,
        meta,
        entry &&
          t('dining.scoreLabel', { score: entry.rating.average.toFixed(1) }),
        entry && t('dining.ratings', { count: entry.rating.count }),
      ]
        .filter(Boolean)
        .join(', ')}
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
      <View>
        <FoodImage
          uri={entry?.coverUrl ?? restaurant.logoUrl}
          cover={Boolean(entry)}
          width={imageWidth}
          height={premium.coverHeight}
          rounded={false}
        />
        {entry && (
          <View style={styles.badge}>
            <ScoreLine rating={entry.rating} />
          </View>
        )}
      </View>
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <BrandBadge
            name={restaurant.name}
            logoUrl={null}
            size={32}
            fallback={false}
          />
          <Text variant="title2" numberOfLines={2} style={styles.title}>
            {restaurant.name}
          </Text>
        </View>
        <Text variant="caption" tone="secondary" numberOfLines={2}>
          {meta}
        </Text>
        {entry && (
          <View style={styles.signature}>
            <Icon
              icon={Award}
              size="small"
              color={colors.brand.accent}
              decorative
            />
            <Text variant="caption" style={styles.accent}>
              {t('dining.signature')}
            </Text>
            <Text variant="callout" numberOfLines={1} style={styles.dish}>
              {entry.signature}
            </Text>
          </View>
        )}
      </View>
    </PressSurface>
  );
});
const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[8] },
  title: { flex: 1 },
  card: {
    ...premium.shadow,
    backgroundColor: colors.surface,
    borderRadius: radius[24],
    marginBottom: spacing[20],
    overflow: 'hidden',
  },
  content: { alignItems: 'stretch', justifyContent: 'flex-start' },
  badge: {
    position: 'absolute',
    left: spacing[12],
    bottom: spacing[12],
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[4],
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  info: { padding: spacing[16], gap: spacing[8] },
  signature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[8],
    borderRadius: radius[12],
    backgroundColor: colors.brand.tint,
  },
  accent: { color: colors.brand.accent },
  dish: { flex: 1, minWidth: 0, color: colors.brand.primary },
});
