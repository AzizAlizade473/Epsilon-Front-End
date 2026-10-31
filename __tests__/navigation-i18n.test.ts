import { expect, test } from '@jest/globals';

import az from '../locales/az.json';
import en from '../locales/en.json';
import ru from '../locales/ru.json';

import { i18n, initializeI18n } from '@/lib/i18n';

test('boot initializes i18n once in AZ; bundled EN/RU are ready without fetching', async () => {
  const first = initializeI18n();
  expect(initializeI18n()).toBe(first);
  await first;
  expect(i18n.t('navigation.welcome')).toBe(az.navigation.welcome);
  await i18n.changeLanguage('en');
  expect(i18n.t('navigation.welcome')).toBe(en.navigation.welcome);
  await i18n.changeLanguage('ru');
  expect(i18n.t('navigation.welcome')).toBe(ru.navigation.welcome);
  await i18n.changeLanguage('az');
});
