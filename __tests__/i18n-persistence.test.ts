/**
 * 04.a — i18n setup, locale files, and language persistence tests.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import * as Localization from 'expo-localization';
import {
  changeLanguage,
  i18n,
  initializeI18n,
  resolveInitialLanguage,
  SUPPORTED_LANGUAGES,
} from '@/lib/i18n';
import az from '../locales/az.json';
import en from '../locales/en.json';
import ru from '../locales/ru.json';

jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [{ languageCode: 'en' }]),
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

describe('04.a — i18n setup and locale structure', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exposes az, en, ru as supported languages with az as default', () => {
    expect(SUPPORTED_LANGUAGES).toEqual(['az', 'en', 'ru']);
  });

  it('all three locale files have matching namespaces and keys', () => {
    /** Plural-form suffixes i18next recognises. */
    const PLURAL_SUFFIXES = [
      '_zero',
      '_one',
      '_two',
      '_few',
      '_many',
      '_other',
    ] as const;

    function baseKey(key: string): string {
      for (const suffix of PLURAL_SUFFIXES) {
        if (key.endsWith(suffix))
          return key.slice(0, key.length - suffix.length);
      }
      return key;
    }

    function basekeySet(keys: string[]): string[] {
      return [...new Set(keys.map(baseKey))].sort();
    }

    const namespaces = Object.keys(az) as (keyof typeof az)[];
    expect(namespaces).toContain('navigation');
    expect(namespaces).toContain('common');
    expect(namespaces).toContain('errors');
    expect(namespaces).toContain('gallery');

    for (const ns of namespaces) {
      // All locales must cover the same BASE keys. Each locale may use its own
      // plural suffixes, so we compare after normalising away the suffix.
      const azBases = basekeySet(Object.keys(az[ns]));
      expect(basekeySet(Object.keys(en[ns]))).toEqual(azBases);
      expect(basekeySet(Object.keys(ru[ns]))).toEqual(azBases);
    }
  });

  it('resolves stored language preference first when present', async () => {
    const mockGet = jest
      .fn<() => Promise<string | null>>()
      .mockResolvedValue('ru');
    const lang = await resolveInitialLanguage(mockGet);
    expect(lang).toBe('ru');
  });

  it('falls back to device language if supported and no saved preference', async () => {
    const mockGet = jest
      .fn<() => Promise<string | null>>()
      .mockResolvedValue(null);
    (Localization.getLocales as jest.Mock).mockReturnValue([
      { languageCode: 'en' },
    ]);

    const lang = await resolveInitialLanguage(mockGet);
    expect(lang).toBe('en');
  });

  it('falls back to az if device language is unsupported', async () => {
    const mockGet = jest
      .fn<() => Promise<string | null>>()
      .mockResolvedValue(null);
    (Localization.getLocales as jest.Mock).mockReturnValue([
      { languageCode: 'fr' },
    ]);

    const lang = await resolveInitialLanguage(mockGet);
    expect(lang).toBe('az');
  });

  it('changes language instantly and persists choice', async () => {
    const mockPersist = jest
      .fn<(lang: string) => Promise<void>>()
      .mockResolvedValue(undefined);
    await initializeI18n('az');

    await changeLanguage('en', mockPersist);
    expect(i18n.language).toBe('en');
    expect(mockPersist).toHaveBeenCalledWith('en');

    await changeLanguage('az', mockPersist);
    expect(i18n.language).toBe('az');
  });
});
