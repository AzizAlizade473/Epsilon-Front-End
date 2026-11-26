import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { FoodImage } from '@/components/food/FoodImage';
import { ScoreLine } from '@/components/ratings/Ratings';
import { PressSurface } from '@/components/ui/PressSurface';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { LikeButton } from '@/components/likes/LikeButton';
import { dishLike } from '@/hooks/likeTargets';
import { colors, layout, radius, spacing } from '@/design';
import { premium } from '@/design/premium';
import { useExplore, type ExploreEntry } from '../exploreFeed';

const GAP = spacing[12];

/** Two columns inside the screen margins, never wider than the content column. */
export function useDishTileWidth() {
  const columnWidth =
    Math.min(useWindowDimensions().width, layout.contentMaxWidth) -
    spacing.screenMargin * 2;
  return Math.floor((columnWidth - GAP) / 2);
}

export function DishTile({
  entry,
  width,
  note,
}: {
  entry: ExploreEntry;
  width: number;
  note?: string;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const open = () =>
    router.push({
      pathname: entry.target.pathname,
      params: { id: entry.target.id, dishId: entry.target.dishId },
    });
  const kind = t('home.kindDish');
  return (
    <View style={{ width }}>
      <PressSurface
        accessibilityLabel={[`${kind}: ${entry.title}`, entry.subtitle, note]
          .filter(Boolean)
          .join(', ')}
        onPress={open}
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
          {note && (
            <Text variant="caption" tone="secondary">
              {note}
            </Text>
          )}
        </View>
      </PressSurface>
      <View style={styles.like}>
        <LikeButton
          variant="overlay"
          target={dishLike(
            entry.target.id,
            entry.target.dishId,
            entry.title,
            entry.subtitle,
            entry.imageUrl,
          )}
        />
      </View>
    </View>
  );
}

/** Best-rated restaurant dishes (labelled demo catalogue outside production). */
export function ExploreSection() {
  const { t } = useTranslation();
  const router = useRouter();
  const query = useExplore();
  const width = useDishTileWidth();
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
          <DishTile key={entry.key} entry={entry} width={width} />
        ))}
      </View>
      <Text variant="caption" tone="secondary">
        {t('home.exploreNote')}
      </Text>
      <Button
        variant="secondary"
        label={t('dishes.seeAll')}
        onPress={() => router.push('/dishes')}
      />
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
  like: { position: 'absolute', right: spacing[4], top: spacing[4] },
});
