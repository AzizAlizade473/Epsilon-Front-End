import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Star from 'lucide-react-native/icons/star';
import { PressSurface } from '@/components/ui/PressSurface';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { colors, radius, spacing } from '@/design';
import { premium } from '@/design/premium';
import { formatMoney } from '@/lib/money';
import type { CatalogDish } from '../catalog';
import { FoodImage } from '@/components/food/FoodImage';

/** Public browsing card: deliberately no rating control or mutation. */
export function MenuDish({
  dish,
  width,
  onPress,
}: {
  dish: CatalogDish;
  width: number;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  return (
    <PressSurface
      accessibilityLabel={`${t(dish.nameKey)}, ${formatMoney(dish.priceMinor)}, ${t('premium.reviewCount', { count: dish.count })}`}
      onPress={onPress}
      contentStyle={[styles.card, { width }]}
      style={styles.outer}
      spring
    >
      <FoodImage photo={dish.photo} width={width} height={premium.dishHeight} />
      <View style={styles.copy}>
        <Text variant="headline">{t(dish.nameKey)}</Text>
        <View style={styles.meta}>
          <Text variant="callout">{formatMoney(dish.priceMinor)}</Text>
          <View style={styles.score}>
            <Icon
              icon={Star}
              size="small"
              color={colors.brand.accent}
              decorative
            />
            <Text variant="caption">{dish.score.toFixed(1)}</Text>
          </View>
        </View>
        <Text variant="caption" tone="secondary">
          {t('premium.reviewCount', { count: dish.count })}
        </Text>
        {dish.comments[0] && (
          <Text variant="caption" tone="secondary" numberOfLines={2}>
            {t(dish.comments[0].textKey)}
          </Text>
        )}
      </View>
    </PressSurface>
  );
}
const styles = StyleSheet.create({
  outer: { marginBottom: spacing[16] },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius[24],
    alignItems: 'stretch',
    overflow: 'hidden',
    justifyContent: 'flex-start',
  },
  copy: { padding: spacing[12], gap: spacing[8] },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing[8],
  },
  score: { flexDirection: 'row', alignItems: 'center', gap: spacing[4] },
});
