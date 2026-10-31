import * as Localization from 'expo-localization';
import * as SecureStore from 'expo-secure-store';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import az from '../../locales/az.json';
import en from '../../locales/en.json';
import ru from '../../locales/ru.json';

import { storageKeys } from './bootstrap';

export type SupportedLanguage = 'az' | 'en' | 'ru';
export const SUPPORTED_LANGUAGES: readonly SupportedLanguage[] = [
  'az',
  'en',
  'ru',
] as const;

export type NavigationTitle = keyof typeof az.navigation;
export const i18n = createInstance().use(initReactI18next);
let initialization: Promise<void> | undefined;

/**
 * Resolves the initial language choice:
 * 1. Saved user preference from SecureStore
 * 2. Device locale if it matches az/en/ru
 * 3. Default fallback: 'az'
 */
export async function resolveInitialLanguage(
  getStoredLanguage = () => SecureStore.getItemAsync(storageKeys.language),
): Promise<SupportedLanguage> {
  try {
    const saved = await getStoredLanguage();
    if (saved && (SUPPORTED_LANGUAGES as readonly string[]).includes(saved)) {
      return saved as SupportedLanguage;
    }
  } catch {
    // Ignore storage read failures and proceed to device locale
  }

  try {
    const locales = Localization.getLocales();
    const primary = locales[0]?.languageCode?.toLowerCase();
    if (
      primary &&
      (SUPPORTED_LANGUAGES as readonly string[]).includes(primary)
    ) {
      return primary as SupportedLanguage;
    }
  } catch {
    // Ignore localization errors
  }

  return 'az';
}

export function initializeI18n(initialLang?: SupportedLanguage): Promise<void> {
  initialization ??= (async () => {
    const lng = initialLang ?? (await resolveInitialLanguage());
    await i18n.init({
      resources: {
        az: { translation: az },
        en: { translation: en },
        ru: { translation: ru },
      },
      lng,
      fallbackLng: 'az',
      supportedLngs: ['az', 'en', 'ru'],
      initAsync: false,
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
    });
    notifyLanguageChanged(i18n.language ?? 'az');
  })().catch((error: unknown) => {
    initialization = undefined;
    throw error;
  });

  return initialization;
}

type LanguageListener = (lang: string) => void;
const _listeners = new Set<LanguageListener>();

export function onLanguageChange(listener: LanguageListener): () => void {
  _listeners.add(listener);
  return () => {
    _listeners.delete(listener);
  };
}

function notifyLanguageChanged(lang: string): void {
  for (const listener of _listeners) {
    try {
      listener(lang);
    } catch {
      // Ignore listener error
    }
  }
}

/**
 * Changes active language instantly and persists the choice to SecureStore.
 */
export async function changeLanguage(
  language: SupportedLanguage,
  persist = (lang: string) =>
    SecureStore.setItemAsync(storageKeys.language, lang),
): Promise<void> {
  if (!(SUPPORTED_LANGUAGES as readonly string[]).includes(language)) {
    throw new Error(`Unsupported language: ${language}`);
  }
  await i18n.changeLanguage(language);
  notifyLanguageChanged(language);
  try {
    await persist(language);
  } catch {
    // Best-effort storage persistence
  }
}
