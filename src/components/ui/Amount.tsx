import { Text } from './Text';
import type { ComponentProps } from 'react';

import { layout, typography } from '@/design';
import { formatMoney, moneyParts, type MoneyOptions } from '@/lib/money';

export type AmountProps = MoneyOptions & {
  minor: number;
  variant?: 'display' | 'title1' | 'title2';
  accessibilityLabel?: string;
  tone?: ComponentProps<typeof Text>['tone'];
};

export function Amount({
  minor,
  sign,
  variant = 'display',
  accessibilityLabel,
  tone,
}: AmountProps) {
  const parts = moneyParts(minor, { sign });
  const type = typography[variant];
  return (
    <Text
      variant={variant}
      tone={tone}
      accessible
      accessibilityLabel={accessibilityLabel ?? formatMoney(minor, { sign })}
    >
      {parts.amount}
      <Text
        variant={variant}
        tone={tone}
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
