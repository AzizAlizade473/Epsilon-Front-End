import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import az from '../../locales/az.json';
import en from '../../locales/en.json';
import ru from '../../locales/ru.json';

export type NavigationTitle = keyof typeof az.navigation;
export const i18n = createInstance().use(initReactI18next);
let initialization: Promise<void> | undefined;

export function initializeI18n(): Promise<void> {
  initialization ??= i18n
    .init({
      resources: {
        az: { translation: az },
        en: { translation: en },
        ru: { translation: ru },
      },
      lng: 'az',
      fallbackLng: 'az',
      supportedLngs: ['az', 'en', 'ru'],
      initAsync: false,
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
    })
    .then(() => undefined)
    .catch((error: unknown) => {
      initialization = undefined;
      throw error;
    });
  return initialization;
}
