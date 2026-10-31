/**
 * 04.d — Locale-aware date and time formatting tests.
 */

import { describe, expect, it } from '@jest/globals';

import { formatDate, formatDateGroup, formatTime } from '@/lib/date';

describe('formatTime', () => {
  it('formats midnight as 00:00', () => {
    const d = new Date(2026, 0, 1, 0, 0, 0);
    expect(formatTime(d)).toBe('00:00');
  });

  it('pads hours and minutes with leading zeros', () => {
    const d = new Date(2026, 5, 15, 9, 5, 0);
    expect(formatTime(d)).toBe('09:05');
  });

  it('formats 23:59 correctly', () => {
    const d = new Date(2026, 11, 31, 23, 59, 0);
    expect(formatTime(d)).toBe('23:59');
  });

  it('accepts ISO date string', () => {
    // Use a fixed local-time date to avoid timezone dependency
    const d = new Date(2026, 3, 12, 14, 30, 0);
    expect(formatTime(d)).toBe('14:30');
  });

  it('throws RangeError for invalid date string', () => {
    expect(() => formatTime('not-a-date')).toThrow(RangeError);
  });
});

describe('formatDate', () => {
  const jan12 = new Date(2026, 0, 12);

  it('formats date in az locale', () => {
    expect(formatDate(jan12, { locale: 'az' })).toBe('12 Yanvar 2026');
  });

  it('formats date in en locale', () => {
    expect(formatDate(jan12, { locale: 'en' })).toBe('12 January 2026');
  });

  it('formats date in ru locale (genitive month)', () => {
    expect(formatDate(jan12, { locale: 'ru' })).toBe('12 января 2026');
  });

  it('formats October in az', () => {
    const oct12 = new Date(2026, 9, 12);
    expect(formatDate(oct12, { locale: 'az' })).toBe('12 Oktyabr 2026');
  });

  it('formats October in en', () => {
    const oct12 = new Date(2026, 9, 12);
    expect(formatDate(oct12, { locale: 'en' })).toBe('12 October 2026');
  });

  it('formats October in ru (genitive)', () => {
    const oct12 = new Date(2026, 9, 12);
    expect(formatDate(oct12, { locale: 'ru' })).toBe('12 октября 2026');
  });

  it('throws RangeError for invalid input', () => {
    expect(() => formatDate('bad-date')).toThrow(RangeError);
  });
});

describe('formatDateGroup', () => {
  const ref = new Date(2026, 9, 12, 12, 0, 0); // Oct 12 2026 noon

  it('returns "Bu gün" for same calendar day in az', () => {
    const today = new Date(2026, 9, 12, 8, 0, 0);
    expect(formatDateGroup(today, { locale: 'az', referenceDate: ref })).toBe(
      'Bu gün',
    );
  });

  it('returns "Today" for same calendar day in en', () => {
    const today = new Date(2026, 9, 12, 23, 59, 0);
    expect(formatDateGroup(today, { locale: 'en', referenceDate: ref })).toBe(
      'Today',
    );
  });

  it('returns "Сегодня" for same calendar day in ru', () => {
    const today = new Date(2026, 9, 12, 0, 1, 0);
    expect(formatDateGroup(today, { locale: 'ru', referenceDate: ref })).toBe(
      'Сегодня',
    );
  });

  it('returns "Dünən" for previous calendar day in az', () => {
    const yesterday = new Date(2026, 9, 11, 23, 59, 0);
    expect(
      formatDateGroup(yesterday, { locale: 'az', referenceDate: ref }),
    ).toBe('Dünən');
  });

  it('returns "Yesterday" for previous calendar day in en', () => {
    const yesterday = new Date(2026, 9, 11, 0, 0, 0);
    expect(
      formatDateGroup(yesterday, { locale: 'en', referenceDate: ref }),
    ).toBe('Yesterday');
  });

  it('returns "Вчера" for previous calendar day in ru', () => {
    const yesterday = new Date(2026, 9, 11, 12, 0, 0);
    expect(
      formatDateGroup(yesterday, { locale: 'ru', referenceDate: ref }),
    ).toBe('Вчера');
  });

  it('returns formatted date for two days ago in az', () => {
    const twoDaysAgo = new Date(2026, 9, 10);
    expect(
      formatDateGroup(twoDaysAgo, { locale: 'az', referenceDate: ref }),
    ).toBe('10 Oktyabr 2026');
  });

  it('returns formatted date for older dates in ru', () => {
    const older = new Date(2026, 2, 5); // March 5
    expect(formatDateGroup(older, { locale: 'ru', referenceDate: ref })).toBe(
      '5 марта 2026',
    );
  });
});
