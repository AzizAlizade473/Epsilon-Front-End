import { expect, it } from '@jest/globals';
import { cardContourPaths } from '@/design/contour';

function bbox(d: string) {
  const n = d.match(/-?\d+(\.\d+)?/g)!.map(Number);
  const xs = n.filter((_, i) => i % 2 === 0);
  const ys = n.filter((_, i) => i % 2 === 1);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

it('draws one set of strictly nested rings, so no two lines can cross', () => {
  const rings = cardContourPaths(320, 200);
  expect(rings).toHaveLength(11);
  const boxes = rings.map(bbox);
  for (let i = 1; i < boxes.length; i++) {
    const [a, b] = [boxes[i - 1]!, boxes[i]!];
    expect(b[0]!).toBeLessThan(a[0]!);
    expect(b[1]!).toBeLessThan(a[1]!);
    expect(b[2]!).toBeGreaterThan(a[2]!);
    expect(b[3]!).toBeGreaterThan(a[3]!);
  }
  expect(cardContourPaths(320, 200)).toEqual(rings);
});
