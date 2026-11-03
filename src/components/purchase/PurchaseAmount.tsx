import { Text } from '@/components/ui/Text';
import { colors, typography } from '@/design';
import { purchaseDesign as p } from '@/design/purchase';
import { formatMoney, moneyParts, type MoneyOptions } from '@/lib/money';

export function PurchaseAmount({
  minor,
  compact = false,
  sign,
}: {
  minor: number;
  compact?: boolean;
  sign?: MoneyOptions['sign'];
}) {
  const parts = moneyParts(minor, { sign });
  return (
    <Text
      accessibilityLabel={formatMoney(minor, { sign })}
      style={[
        compact ? typography.title1 : p.balance,
        { color: colors.brand.primary, fontVariant: ['tabular-nums'] },
      ]}
    >
      {parts.amount}
      <Text
        style={[
          compact ? typography.headline : typography.title1,
          { color: colors.brand.primary },
        ]}
      >{` ${parts.currency}`}</Text>
    </Text>
  );
}
