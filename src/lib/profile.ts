import { z } from 'zod';
export const profileNameSchema = z
  .string()
  .trim()
  .min(2)
  .max(40)
  .regex(/^[\p{L}\p{M}]+(?:[ '\u2019-][\p{L}\p{M}]+)*$/u);
export function maskedPhone(value: string | null) {
  return value ? `${value.slice(0, 4)} ••• •• ${value.slice(-2)}` : '';
}
