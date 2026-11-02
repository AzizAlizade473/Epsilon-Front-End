import { expect, jest, test } from '@jest/globals';
import { focusAccessible } from '@/lib/focus-accessible.web';

test('web Sheet focuses the DOM ref without resolving native node handles', () => {
  const focus = jest.fn();
  focusAccessible({ focus });
  expect(focus).toHaveBeenCalledTimes(1);
  expect(() => focusAccessible(null)).not.toThrow();
  expect(() => focusAccessible({})).not.toThrow();
});
