import { describe, expect, it } from '@jest/globals';
import {
  formatPhone,
  maskPhone,
  otpSchema,
  phoneSchema,
} from '@/features/auth/schemas';

describe('Azerbaijan phone entry', () => {
  it.each(['50', '51', '55', '70', '77', '99', '10', '60'])(
    'accepts mobile prefix %s',
    (prefix) => {
      expect(phoneSchema.parse(`${prefix}1234567`)).toBe(
        `+994${prefix}1234567`,
      );
    },
  );
  it.each(['+994501234567', '0501234567', '50 123 45 67'])(
    'normalizes paste %s',
    (value) => {
      expect(phoneSchema.parse(value)).toBe('+994501234567');
      expect(formatPhone(value)).toBe('50 123 45 67');
    },
  );
  it.each([
    '',
    '121234567',
    '+995501234567',
    '50123456',
    '5012345678',
    '9945012345678',
  ])('rejects incomplete, foreign or overlong input %s', (value) => {
    expect(phoneSchema.safeParse(value).success).toBe(false);
  });
  it('masks the phone and requires exactly six ASCII digits', () => {
    expect(maskPhone('+994501234567')).toBe('+994 50 ••• •• 67');
    expect(otpSchema.safeParse('123456').success).toBe(true);
    for (const code of ['', '12345', '1234567', '12345a'])
      expect(otpSchema.safeParse(code).success).toBe(false);
  });
});
