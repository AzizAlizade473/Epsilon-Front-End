/**
 * 04.e — i18next plural rules tests for az, en, and ru.
 *
 * i18next v21+ uses Intl.PluralRules internally.
 * az: 2 forms (_one for 1, _other for everything else)
 * en: 2 forms (_one for 1, _other for everything else)
 * ru: 4 forms (_one, _few, _many, _other per Slavic plural rules)
 */

import { describe, expect, it, beforeAll } from '@jest/globals';
import { initializeI18n, i18n } from '@/lib/i18n';

beforeAll(async () => {
  await initializeI18n('en');
});

describe('04.e — plural rules', () => {
  describe('English (2-form)', () => {
    beforeAll(async () => {
      await i18n.changeLanguage('en');
    });

    it('1 → singular form', () => {
      expect(i18n.t('common.points', { count: 1 })).toBe('1 point');
    });

    it('0 → plural form', () => {
      expect(i18n.t('common.points', { count: 0 })).toBe('0 points');
    });

    it('2 → plural form', () => {
      expect(i18n.t('common.points', { count: 2 })).toBe('2 points');
    });

    it('5 → plural form', () => {
      expect(i18n.t('common.points', { count: 5 })).toBe('5 points');
    });

    it('21 → plural form', () => {
      expect(i18n.t('common.points', { count: 21 })).toBe('21 points');
    });
  });

  describe('Azerbaijani (2-form: one/other)', () => {
    beforeAll(async () => {
      await i18n.changeLanguage('az');
    });

    it('1 → one form (1 xal)', () => {
      expect(i18n.t('common.points', { count: 1 })).toBe('1 xal');
    });

    it('2 → other form (2 xal)', () => {
      expect(i18n.t('common.points', { count: 2 })).toBe('2 xal');
    });

    it('5 → other form (5 xal)', () => {
      expect(i18n.t('common.points', { count: 5 })).toBe('5 xal');
    });
  });

  describe('Russian (3 meaningful forms: one/few/many)', () => {
    beforeAll(async () => {
      await i18n.changeLanguage('ru');
    });

    it('1 → _one (1 очко)', () => {
      expect(i18n.t('common.points', { count: 1 })).toBe('1 очко');
    });

    it('21 → _one (21 очко)', () => {
      expect(i18n.t('common.points', { count: 21 })).toBe('21 очко');
    });

    it('2 → _few (2 очка)', () => {
      expect(i18n.t('common.points', { count: 2 })).toBe('2 очка');
    });

    it('3 → _few (3 очка)', () => {
      expect(i18n.t('common.points', { count: 3 })).toBe('3 очка');
    });

    it('4 → _few (4 очка)', () => {
      expect(i18n.t('common.points', { count: 4 })).toBe('4 очка');
    });

    it('5 → _many (5 очков)', () => {
      expect(i18n.t('common.points', { count: 5 })).toBe('5 очков');
    });

    it('11 → _many (11 очков — eleven is always many in Russian)', () => {
      expect(i18n.t('common.points', { count: 11 })).toBe('11 очков');
    });

    it('20 → _many (20 очков)', () => {
      expect(i18n.t('common.points', { count: 20 })).toBe('20 очков');
    });

    it('100 → _many (100 очков)', () => {
      expect(i18n.t('common.points', { count: 100 })).toBe('100 очков');
    });
  });
});
