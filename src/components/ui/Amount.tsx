import { Text } from './Text';

import { layout, typography } from '@/design';
import { formatMoney, moneyParts, type MoneyOptions } from '@/lib/money';

export type AmountProps = MoneyOptions & {
  minor: number;
  variant?: 'display' | 'title1' | 'title2';
  accessibilityLabel?: string;
};

export function Amount({
  minor,
  sign,
  variant = 'display',
  accessibilityLabel,
}: AmountProps) {
  const parts = moneyParts(minor, { sign });
  const type = typography[variant];
  return (
    <Text
      variant={variant}
      accessible
      accessibilityLabel={accessibilityLabel ?? formatMoney(minor, { sign })}
    >
      {parts.amount}
      <Text
        variant={variant}
        style={{
          fontSize: type.fontSize * layout.currencyScale,
          lineHeight: type.lineHeight * layout.currencyScale,
        }}
      >
        {` ${parts.currency}`}
      </Text>
    </Text>
  );
}
