import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { PressSurface } from '@/components/ui/PressSurface';
import { Text } from '@/components/ui/Text';
import { colors, radius, spacing } from '@/design';
import { premium } from '@/design/premium';
import { formatMoney } from '@/lib/money';
import type { CatalogDish } from '../catalog';
import { FoodImage } from '@/components/food/FoodImage';
import { ScoreLine } from '@/components/ratings/Ratings';

/** Public menu row: deliberately no rating control or mutation. */
export const MenuDish = memo(function MenuDish({
  dish,
  onPress,
}: {
  dish: CatalogDish;
  onPress: (dishId: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <PressSurface
      accessibilityLabel={[
        dish.name,
        dish.priceMinor === null ? null : formatMoney(dish.priceMinor),
        t('dining.scoreLabel', { score: dish.rating.average.toFixed(1) }),
        t('dining.ratings', { count: dish.rating.count }),
      ]
        .filter(Boolean)
        .join(', ')}
      onPress={() => onPress(dish.id)}
      contentStyle={styles.row}
      pressedColor={colors.divider}
    >
      <View style={styles.copy}>
        <Text variant="headline" numberOfLines={2}>
          {dish.name}
        </Text>
        <ScoreLine rating={dish.rating} />
        {dish.preview && (
          <Text variant="caption" tone="secondary" numberOfLines={2}>
            {`“${dish.preview.comment}”`}
          </Text>
        )}
        {dish.priceMinor !== null && (
          <Text variant="callout" style={styles.price}>
            {formatMoney(dish.priceMinor)}
          </Text>
        )}
      </View>
      <FoodImage
        uri={dish.imageUrl}
        cover
        width={premium.menuThumb}
        height={premium.menuThumb}
      />
    </PressSurface>
  );
});
const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[16],
    paddingVertical: spacing[16],
    paddingHorizontal: spacing.screenMargin,
    borderRadius: radius[16],
  },
  copy: { flex: 1, minWidth: 0, gap: spacing[8] },
  price: { color: colors.brand.primary },
});
