export type MoneyOptions = { sign?: 'auto' | 'always' };

/** Presentation only. Never accepts floating point amounts or unsafe integers. */
export function moneyParts(
  minor: number,
  { sign = 'auto' }: MoneyOptions = {},
) {
  'worklet';
  if (!Number.isSafeInteger(minor)) {
    throw new RangeError('Expected safe integer minor units');
  }
  const absolute = Math.abs(minor);
  const whole = Math.trunc(absolute / 100);
  const fraction = String(absolute % 100).padStart(2, '0');
  const prefix = minor < 0 ? '−' : sign === 'always' ? '+' : '';
  return { amount: `${prefix}${whole}.${fraction}`, currency: '₼' } as const;
}

export function formatMoney(minor: number, options?: MoneyOptions): string {
  const { amount, currency } = moneyParts(minor, options);
  return `${amount} ${currency}`;
}
