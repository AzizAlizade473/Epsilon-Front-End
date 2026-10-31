import { expect, test } from '@jest/globals';

import { galleryCopy } from '@/components/dev/galleryCopy';

test.each(Object.values(galleryCopy))(
  'gallery translations have identical non-empty keys',
  (copy) => {
    expect(Object.keys(copy).sort()).toEqual(
      Object.keys(galleryCopy.az).sort(),
    );
    for (const value of Object.values(copy))
      expect(value.trim().length).toBeGreaterThan(0);
  },
);
