import { expect, test } from '@jest/globals';

import { chooseIntroVariant } from '@/components/brand/introVariant';

const base = {
  seenVersion: null,
  version: '1.2.0',
  reduceMotion: false,
  videoAvailable: true,
};

test('first launch after install plays the full drawn intro', () => {
  expect(chooseIntroVariant(base)).toBe('full');
});

test('an app update plays the full intro once more', () => {
  expect(chooseIntroVariant({ ...base, seenVersion: '1.1.0' })).toBe('full');
});

test('later cold starts of the same version get the short intro', () => {
  expect(chooseIntroVariant({ ...base, seenVersion: '1.2.0' })).toBe('short');
});

test('builds without the native video module never try to play the video', () => {
  expect(chooseIntroVariant({ ...base, videoAvailable: false })).toBe('short');
});

test('Reduce Motion always gets the still intro', () => {
  expect(chooseIntroVariant({ ...base, reduceMotion: true })).toBe('still');
  expect(
    chooseIntroVariant({ ...base, reduceMotion: true, seenVersion: '1.2.0' }),
  ).toBe('still');
});
