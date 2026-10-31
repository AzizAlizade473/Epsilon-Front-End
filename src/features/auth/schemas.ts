import { z } from 'zod';

/** Normalize only recognized country/trunk prefixes; never silently truncate. */
export function phoneDigits(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.startsWith('994') && digits.length > 9) return digits.slice(3);
  if (digits.startsWith('0')) return digits.slice(1);
  return digits;
}

export function formatPhone(value: string): string {
  const digits = phoneDigits(value);
  return [
    digits.slice(0, 2),
    digits.slice(2, 5),
    digits.slice(5, 7),
    digits.slice(7),
  ]
    .filter(Boolean)
    .join(' ');
}

export const phoneSchema = z
  .string()
  .transform(phoneDigits)
  .pipe(z.string().regex(/^(50|51|55|70|77|99|10|60)\d{7}$/))
  .transform((digits) => `+994${digits}`);

export const otpSchema = z.string().regex(/^\d{6}$/);

export function maskPhone(phone: string): string {
  const digits = phoneDigits(phone);
  return `+994 ${digits.slice(0, 2)} ••• •• ${digits.slice(-2)}`;
}
