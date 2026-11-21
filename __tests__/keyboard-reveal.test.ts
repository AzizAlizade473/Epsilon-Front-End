import { expect, it } from '@jest/globals';
import { revealDelta } from '@/hooks/useKeyboardReveal';

it('scrolls only when the focused field would sit under the keyboard', () => {
  expect(revealDelta(500, 600, 24)).toBe(0);
  expect(revealDelta(590, 600, 24)).toBe(14);
  expect(revealDelta(700, 400, 24)).toBe(324);
});
