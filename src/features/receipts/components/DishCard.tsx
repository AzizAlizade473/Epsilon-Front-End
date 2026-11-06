import Coffee from 'lucide-react-native/icons/coffee';
import Croissant from 'lucide-react-native/icons/croissant';
import Utensils from 'lucide-react-native/icons/utensils';
import Check from 'lucide-react-native/icons/check';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { spacing } from '@/design';
import { originalReceipts as o } from '@/design/original-receipts';
import { formatMoney } from '@/lib/money';
import type { ReceiptItem } from '@/services/contracts';
import { OriginalStars } from '@/components/receipts/OriginalStars';

/** Source: ProductCard.tsx / ReceiptItemCard at Epsilon@8f133b0.
 * Product category is not in this contract: icon matching is decorative only.
 * Per-product payouts, multipliers and editing controls are intentionally absent.
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
  const drink = /coffee|kapu|latte|espresso|cappucc|кофе|капуч/i.test(
    item.name,
  );
  const bakery = /croissant|kruasan|bread|çörək|круас/i.test(item.name);
  const icon = drink ? Coffee : bakery ? Croissant : Utensils;
  return (
    <View style={[styles.card, !item.canRate && !rated && styles.unavailable]}>
      <View style={styles.main}>
        <View
          style={[
            styles.icon,
            { backgroundColor: drink ? o.colors.drinkTint : o.colors.foodTint },
          ]}
        >
          <Icon
            icon={icon}
            color={drink ? o.colors.drink : o.colors.food}
            decorative
          />
        </View>
        <View style={styles.copy}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.sub}>
            {t('receipt.quantityPrice', {
              qty: item.quantity,
              price: formatMoney(item.unitPriceMinor),
            })}
          </Text>
        </View>
      </View>
      {(item.canRate || rated || pending) && (
        <View style={styles.rating}>
          {canRate ? (
            <OriginalStars
              value={0}
              onRate={(value) => onRate(value)}
              label={t('receipt.rateItem', { name: item.name })}
            />
          ) : item.rating !== null ? (
            <OriginalStars value={item.rating} disabled />
          ) : null}
          {rated ? (
            <View style={styles.state}>
              <Icon
                icon={Check}
                size="small"
                color={o.colors.rated}
                decorative
              />
              <Text style={styles.sub}>{t('receipt.rated')}</Text>
            </View>
          ) : pending ? (
            <Text style={styles.sub} accessibilityLiveRegion="polite">
              {t('feedback.queued')}
            </Text>
          ) : canRate ? (
            <TouchableOpacity
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('receipt.rateItem', { name: item.name })}
              onPress={() => onRate()}
              style={styles.rate}
            >
              <Text style={styles.rateText}>{t('receipt.rate')}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    ...o.dishShadow,
    padding: spacing[12],
    borderRadius: o.radius.dish,
    borderWidth: 1,
    borderColor: o.colors.border,
    backgroundColor: o.colors.surface,
    marginBottom: spacing[12],
  },
  unavailable: { opacity: 0.6, backgroundColor: o.colors.soft },
  main: { flexDirection: 'row', alignItems: 'center', gap: spacing[12] },
  icon: {
    width: o.size.icon,
    height: o.size.icon,
    borderRadius: o.radius.icon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, minWidth: 0, gap: spacing[4] },
  name: { ...o.type.product, color: o.colors.ink },
  sub: { ...o.type.caption, color: o.colors.secondary },
  rating: {
    marginTop: spacing[12],
    paddingTop: spacing[8],
    borderTopWidth: 1,
    borderTopColor: o.colors.border,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[4],
  },
  rate: {
    minWidth: o.size.target,
    minHeight: o.size.target,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[8],
    borderRadius: o.radius.badge,
    backgroundColor: o.colors.soft,
  },
  rateText: { ...o.type.caption, fontWeight: '700', color: o.colors.primary },
  state: { flexDirection: 'row', alignItems: 'center', gap: spacing[4] },
});
