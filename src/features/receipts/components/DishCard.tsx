import Check from 'lucide-react-native/icons/check';
import Clock from 'lucide-react-native/icons/clock';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { ReduceMotion, ZoomIn } from 'react-native-reanimated';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { spacing } from '@/design';
import { originalReceipts as o } from '@/design/original-receipts';
import { formatMoney } from '@/lib/money';
import { dishName } from '@/lib/dish-name';
import type { ReceiptItem } from '@/services/contracts';
import { OriginalStars } from '@/components/receipts/OriginalStars';
import { FoodImage } from '@/components/food/FoodImage';

/** Printed quantity from thousandths, without float noise: 370 → "0.37", 2000 → "2". */
export const formatQuantity = (milli: number) =>
  `${Math.trunc(milli / 1000)}${
    milli % 1000
      ? `.${String(milli % 1000)
          .padStart(3, '0')
          .replace(/0+$/, '')}`
      : ''
  }`;

const checkIn = ZoomIn.duration(220).reduceMotion(ReduceMotion.System);

/**
 * One purchased dish. One way to rate: tapping a star (or the card) opens the
 * rating sheet, the chosen star preselected. Product category is not in the
 * contract, so the icon is decorative only.
 */
export function DishCard({
  item,
  readOnly,
  pending,
  completed,
  onRate,
}: {
  item: ReceiptItem;
  readOnly: boolean;
  pending: boolean;
  completed: boolean;
  onRate: (rating?: number) => void;
}) {
  const { t } = useTranslation();
  const rated = item.rating !== null || completed;
  const canRate = !readOnly && item.canRate && !rated && !pending;
  const name = dishName(item.name);
  const price = item.line
    ? t('fiscal.linePrice', {
        qty: formatQuantity(item.line.quantityMilli),
        unit: item.line.unit ?? '',
        price: formatMoney(item.line.unitPriceMinor),
        total: formatMoney(item.line.lineTotalMinor),
      })
    : t('receipt.quantityPrice', {
        qty: item.quantity,
        price: formatMoney(item.unitPriceMinor),
      });
  const body = (
    <>
      <View style={styles.main}>
        {/* Only a verified product photo; otherwise the dish name carries the row. */}
        {(item.id === 'item_01' || item.id === 'item_02') && (
          <View style={styles.icon}>
            <FoodImage
              photo="coffee"
              width={o.size.icon}
              height={o.size.icon}
            />
          </View>
        )}
        <View style={styles.copy}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.sub}>{price}</Text>
          {item.line?.cashbackClaimed && (
            <Text style={styles.sub}>{t('fiscal.cashbackClaimed')}</Text>
          )}
        </View>
        {rated && (
          <Animated.View entering={checkIn} style={styles.done}>
            <Icon
              icon={Check}
              size="small"
              color={o.colors.surface}
              decorative
            />
          </Animated.View>
        )}
      </View>
      {canRate ? (
        <View style={styles.rating}>
          <OriginalStars
            value={0}
            onRate={(value) => onRate(value)}
            label={t('receipt.rateItem', { name })}
          />
          <Text style={styles.hint}>{t('receipt.tapToRate')}</Text>
        </View>
      ) : rated ? (
        <View style={styles.rating}>
          {item.rating !== null ? (
            <OriginalStars value={item.rating} disabled />
          ) : (
            <View />
          )}
          <Text style={[styles.hint, styles.ratedText]}>
            {t('receipt.rated')}
          </Text>
        </View>
      ) : pending ? (
        <View style={styles.state} accessibilityLiveRegion="polite">
          <Icon icon={Clock} size="small" color={o.colors.pending} decorative />
          <Text style={styles.sub}>{t('feedback.queued')}</Text>
        </View>
      ) : null}
    </>
  );
  return canRate ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('receipt.rateItem', { name })}
      onPress={() => onRate()}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {body}
    </Pressable>
  ) : (
    <View
      style={[
        styles.card,
        rated && styles.cardRated,
        !item.canRate && !rated && !pending && styles.unavailable,
      ]}
    >
      {body}
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    ...o.dishShadow,
    padding: spacing[16],
    borderRadius: o.radius.dish,
    borderWidth: 1,
    borderColor: o.colors.border,
    backgroundColor: o.colors.surface,
    gap: spacing[12],
  },
  pressed: { transform: [{ scale: 0.985 }], backgroundColor: o.colors.soft },
  cardRated: { borderColor: o.colors.ratedTint },
  unavailable: { opacity: 0.6, backgroundColor: o.colors.soft },
  main: { flexDirection: 'row', alignItems: 'center', gap: spacing[12] },
  icon: {
    width: o.size.icon,
    height: o.size.icon,
    borderRadius: o.radius.icon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  name: {
    ...o.type.product,
    fontSize: 16,
    lineHeight: 22,
    color: o.colors.ink,
  },
  sub: { ...o.type.caption, color: o.colors.secondary },
  done: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: o.colors.rated,
  },
  rating: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[4],
    marginLeft: -spacing[8],
  },
  hint: { ...o.type.caption, color: o.colors.secondary },
  ratedText: { color: o.colors.rated, fontWeight: '700' },
  state: { flexDirection: 'row', alignItems: 'center', gap: spacing[4] },
});
