import { expect, it } from '@jest/globals';
import {
  createProfileSchema,
  defaultBirthDate,
  hasMinimumAge,
} from '@/features/auth/profile-schema';
import { profileUpdateResultSchema } from '@/services/contracts';
import { mockUser } from '@/services/mock/fixtures';

const today = new Date(2026, 9, 31, 12);
it('allows exactly the minimum age and blocks one day short', () => {
  expect(hasMinimumAge('2010-10-31', 16, today)).toBe(true);
  expect(hasMinimumAge('2010-11-01', 16, today)).toBe(false);
  expect(hasMinimumAge('2010-10-30', 16, today)).toBe(true);
});
it('validates leap days and calendar boundaries without rolling invalid dates', () => {
  expect(hasMinimumAge('2008-02-29', 18, new Date(2026, 1, 28, 12))).toBe(
    false,
  );
  expect(hasMinimumAge('2008-02-29', 18, new Date(2026, 2, 1, 12))).toBe(true);
  expect(defaultBirthDate(new Date(2024, 1, 29, 12))).toBe('2006-02-28');
});
it.each(['Əli', "O'Neil", 'Анна-Мария', 'Jean Luc', 'İlqar', 'Aygün'])(
  'accepts localized name %s',
  (firstName) => {
    const result = createProfileSchema(16, today).safeParse({
      firstName,
      lastName: 'Əliyev',
      birthDate: '2000-01-01',
      language: 'az',
    });
    expect(result.success).toBe(true);
  },
);
it.each([
  { firstName: 'A' },
  { lastName: 'Name1' },
  { birthDate: '2025-02-29' },
  { birthDate: '2027-01-01' },
  { birthDate: '2010-11-01' },
  { firstName: 'x'.repeat(41) },
])('rejects invalid profile fields', (patch) => {
  expect(
    createProfileSchema(16, today).safeParse({
      firstName: 'Əli',
      lastName: 'Əliyev',
      birthDate: '2000-01-01',
      language: 'az',
      ...patch,
    }).success,
  ).toBe(false);
});
it('validates both canonical and legacy profile responses and rejects unknown nextStep', () => {
  expect(
    profileUpdateResultSchema.parse({ user: mockUser, nextStep: 'phone' })
      .nextStep,
  ).toBe('phone');
  expect(profileUpdateResultSchema.parse(mockUser)).toEqual({
    user: mockUser,
    nextStep: null,
  });
  expect(
    profileUpdateResultSchema.safeParse({ user: mockUser, nextStep: 'skip' })
      .success,
  ).toBe(false);
});
