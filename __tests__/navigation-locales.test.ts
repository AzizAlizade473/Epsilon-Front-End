import { expect, test } from '@jest/globals';

import az from '../locales/az.json';
import en from '../locales/en.json';
import ru from '../locales/ru.json';

test.each([az, en, ru])(
  'navigation copy has matching non-empty keys',
  (locale) => {
    expect(Object.keys(locale.navigation).sort()).toEqual(
      Object.keys(az.navigation).sort(),
    );
    for (const value of Object.values(locale.navigation))
      expect(value.trim()).not.toBe('');
  },
);
