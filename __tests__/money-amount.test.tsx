import { expect, test } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';

import { Amount } from '@/components/ui/Amount';
import { formatMoney } from '@/lib/money';

test.each([
  [0, '0.00 ₼'],
  [5, '0.05 ₼'],
  [100, '1.00 ₼'],
  [123456, '1234.56 ₼'],
  [-320, '−3.20 ₼'],
  [Number.MAX_SAFE_INTEGER, '90071992547409.91 ₼'],
])('formats %s integer minor units', (minor, expected) => {
  expect(formatMoney(Number(minor))).toBe(expected);
});

test.each([NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1])(
  'rejects malformed money %s',
  (minor) => {
    expect(() => formatMoney(minor)).toThrow(RangeError);
  },
);

test('explicit signs and a supplied spoken amount remain accessible', async () => {
  expect(formatMoney(320, { sign: 'always' })).toBe('+3.20 ₼');
  await render(<Amount minor={1250} accessibilityLabel="12 manat 50 qəpik" />);
  expect(screen.getByLabelText('12 manat 50 qəpik')).toHaveTextContent(
    '12.50 ₼',
  );
});
