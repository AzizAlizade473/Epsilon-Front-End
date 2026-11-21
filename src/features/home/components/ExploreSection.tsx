import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { FoodImage } from '@/components/food/FoodImage';
import { ScoreLine } from '@/components/ratings/Ratings';
import { PressSurface } from '@/components/ui/PressSurface';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Text } from '@/components/ui/Text';
import { colors, layout, radius, spacing } from '@/design';
import { premium } from '@/design/premium';
import {
  filterFeed,
  useExplore,
  type ExploreEntry,
  type ExploreFilter,
} from '../exploreFeed';

const GAP = spacing[12];

function Card({ entry, width }: { entry: ExploreEntry; width: number }) {
  const { t } = useTranslation();
  const router = useRouter();
  const open = () =>
    entry.target.pathname === '/restaurant/[id]/dish/[dishId]'
      ? router.push({
          pathname: entry.target.pathname,
          params: { id: entry.target.id, dishId: entry.target.dishId },
        })
      : router.push({
          pathname: entry.target.pathname,
          params: { id: entry.target.id, productId: entry.target.productId },
        });
  const kind = t(entry.kind === 'dish' ? 'home.kindDish' : 'home.kindProduct');
  return (
    <PressSurface
      accessibilityLabel={`${kind}: ${entry.title}, ${entry.subtitle}`}
      onPress={open}
      style={{ width }}
      contentStyle={styles.card}
      spring
    >
      <View>
        <FoodImage
          uri={entry.imageUrl}
          // Dishes are photographs (fill); packaged products are packshots (fit).
          cover={entry.kind === 'dish'}
          width={width}
          height={premium.exploreImage}
          rounded={false}
        />
        <View
          style={[styles.kind, entry.kind === 'product' && styles.kindProduct]}
        >
          <Text
            variant="caption"
            style={{
              color:
                entry.kind === 'dish' ? colors.brand.primary : colors.surface,
            }}
          >
            {kind}
          </Text>
        </View>
      </View>
      <View style={styles.copy}>
        <Text variant="callout" numberOfLines={2}>
          {entry.title}
        </Text>
        <Text variant="caption" tone="secondary" numberOfLines={2}>
          {entry.subtitle}
        </Text>
        <ScoreLine rating={entry.rating} />
      </View>
    </PressSurface>
  );
}

/** Restaurant dishes and supermarket products as one Epsilon feed. */
export function ExploreSection() {
  const { t } = useTranslation();
  const query = useExplore();
  const [filter, setFilter] = useState<ExploreFilter>('all');
  const columnWidth =
    Math.min(useWindowDimensions().width, layout.contentMaxWidth) -
    spacing.screenMargin * 2;
  const width = Math.floor((columnWidth - GAP) / 2);
  const dishes = query.data?.dishes ?? [];
  const products = query.data?.products ?? [];
  // Production builds have neither demo catalogue: the section simply isn't there.
  if (!dishes.length && !products.length) return null;
  const items = filterFeed(dishes, products, filter);
  return (
    <View style={styles.section}>
      <Text variant="title2" accessibilityRole="header">
        {t('home.exploreTitle')}
      </Text>
      <SegmentedControl
        label={t('home.exploreTitle')}
        options={[
          { value: 'all', label: t('home.exploreAll') },
          { value: 'restaurants', label: t('home.exploreRestaurants') },
          { value: 'supermarkets', label: t('home.exploreSupermarkets') },
        ]}
        value={filter}
        onValueChange={setFilter}
      />
      <View style={styles.grid}>
        {items.map((entry) => (
          <Card key={entry.key} entry={entry} width={width} />
        ))}
      </View>
      <Text variant="caption" tone="secondary">
        {t('home.exploreNote')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing[12] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  card: {
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    borderRadius: radius[20],
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: layout.hairlineWidth,
    borderColor: colors.border,
  },
  kind: {
    position: 'absolute',
    left: spacing[8],
    top: spacing[8],
    paddingHorizontal: spacing[8],
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  kindProduct: { backgroundColor: colors.brand.primary },
  copy: { padding: spacing[12], gap: spacing[4] },
});
