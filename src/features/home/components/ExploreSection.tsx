import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { FoodImage } from '@/components/food/FoodImage';
import { ScoreLine } from '@/components/ratings/Ratings';
import { PressSurface } from '@/components/ui/PressSurface';
import { Text } from '@/components/ui/Text';
import { colors, layout, radius, spacing } from '@/design';
import { premium } from '@/design/premium';
import { useExplore, type ExploreEntry } from '../exploreFeed';

const GAP = spacing[12];

function Card({ entry, width }: { entry: ExploreEntry; width: number }) {
  const { t } = useTranslation();
  const router = useRouter();
  const open = () =>
    router.push({
      pathname: entry.target.pathname,
      params: { id: entry.target.id, dishId: entry.target.dishId },
    });
  const kind = t('home.kindDish');
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
          cover
          width={width}
          height={premium.exploreImage}
          rounded={false}
        />
        <View style={styles.kind}>
          <Text variant="caption" style={{ color: colors.brand.primary }}>
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

/** Best-rated restaurant dishes (labelled demo catalogue outside production). */
export function ExploreSection() {
  const { t } = useTranslation();
  const query = useExplore();
  const columnWidth =
    Math.min(useWindowDimensions().width, layout.contentMaxWidth) -
    spacing.screenMargin * 2;
  const width = Math.floor((columnWidth - GAP) / 2);
  const dishes = query.data?.dishes ?? [];
  // Production builds have neither demo catalogue: the section simply isn't there.
  if (!dishes.length) return null;
  return (
    <View style={styles.section}>
      <Text variant="title2" accessibilityRole="header">
        {t('home.exploreTitle')}
      </Text>
      <View style={styles.grid}>
        {dishes.map((entry) => (
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
  copy: { padding: spacing[12], gap: spacing[4] },
});
