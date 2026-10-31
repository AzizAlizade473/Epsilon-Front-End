import { z } from 'zod';

export function dateOnly(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function parseBirthDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00`);
  return Number.isFinite(date.getTime()) && dateOnly(date) === value
    ? date
    : null;
}
export function hasMinimumAge(birth: string, age: number, today: Date) {
  const date = parseBirthDate(birth);
  if (!date || date > today) return false;
  const years = today.getFullYear() - date.getFullYear();
  const beforeBirthday =
    today.getMonth() < date.getMonth() ||
    (today.getMonth() === date.getMonth() && today.getDate() < date.getDate());
  return years - Number(beforeBirthday) >= age;
}
export function defaultBirthDate(today: Date) {
  const date = new Date(today);
  date.setFullYear(today.getFullYear() - 18, today.getMonth(), 1);
  date.setDate(
    Math.min(
      today.getDate(),
      new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate(),
    ),
  );
  return dateOnly(date);
}
const name = z
  .string()
  .trim()
  .min(2, 'onboarding.invalidName')
  .max(40, 'onboarding.invalidName')
  .regex(
    /^[\p{L}\p{M}]+(?:[ '\u2019-][\p{L}\p{M}]+)*$/u,
    'onboarding.invalidName',
  );
export function createProfileSchema(minAge: number, today: Date) {
  return z.object({
    firstName: name,
    lastName: name,
    birthDate: z
      .string()
      .refine(
        (value) => parseBirthDate(value) !== null && value <= dateOnly(today),
        'onboarding.invalidDate',
      )
      .refine(
        (value) =>
          !parseBirthDate(value) || hasMinimumAge(value, minAge, today),
        'onboarding.ageRestricted',
      ),
    language: z.enum(['az', 'en', 'ru']),
  });
}
export type ProfileInput = z.infer<ReturnType<typeof createProfileSchema>>;
