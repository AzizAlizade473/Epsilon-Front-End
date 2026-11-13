import { expect, it } from '@jest/globals';
import { contourPaths } from '@/features/auth/components/contour';

it('builds closed, finite contour rings for any header size', () => {
  for (const [width, height] of [
    [360, 280],
    [480, 440],
    [1, 1],
  ] as const) {
    const paths = contourPaths(width, height);
    expect(paths).toHaveLength(24);
    for (const d of paths) {
      expect(d.startsWith('M')).toBe(true);
      expect(d.endsWith('Z')).toBe(true);
      expect(d).not.toMatch(/NaN|Infinity/);
    }
  }
});
