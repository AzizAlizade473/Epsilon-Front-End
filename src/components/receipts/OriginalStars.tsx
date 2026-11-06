import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Star from 'lucide-react-native/icons/star';
import { originalReceipts as o } from '@/design/original-receipts';
import { colors, layout } from '@/design';
import { decorativeSvgProps } from '@/lib/decorative-svg';

/** Plain brand-colored stars, preserving the original rating interactions. */
export function OriginalStars({
  value,
  onRate,
  disabled = false,
  large = false,
  label,
}: {
  value: number;
  onRate?: (rating: number) => void;
  disabled?: boolean;
  large?: boolean;
  label?: string;
}) {
  const { t } = useTranslation();
  const readonly = disabled || !onRate;
  return (
    <View
      style={styles.row}
      accessibilityRole={readonly ? 'text' : 'radiogroup'}
      accessible={readonly}
      accessibilityLabel={label ?? t('feedback.ratingValue', { count: value })}
    >
      {[1, 2, 3, 4, 5].map((i) => {
        const star = (
          <Star
            size={large ? o.size.modalStar : o.size.star}
            strokeWidth={layout.iconStrokeWidth}
            color={i <= value ? colors.brand.primary : colors.inkMuted}
            fill={i <= value ? colors.brand.primary : colors.transparent}
            {...decorativeSvgProps}
          />
        );
        return readonly ? (
          <View key={i} style={styles.readonly}>
            {star}
          </View>
        ) : (
          <TouchableOpacity
            key={i}
            activeOpacity={0.7}
            disabled={disabled}
            accessibilityRole="radio"
            accessibilityLabel={t('feedback.starChoice', {
              count: i,
              meaning: t('feedback.rating.' + i),
            })}
            accessibilityState={{ checked: value === i, disabled }}
            onPress={() => onRate?.(i)}
            style={styles.target}
          >
            {star}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  target: {
    minWidth: o.size.target,
    minHeight: o.size.target,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readonly: { paddingHorizontal: 2, paddingVertical: 2 },
});
