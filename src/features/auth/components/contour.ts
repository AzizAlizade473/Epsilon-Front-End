/** Decorative topographic rings for the auth header; pure so geometry is testable. */
export type ContourOrigin = { x: number; y: number; phase: number };

const origins: readonly ContourOrigin[] = [
  { x: 0.18, y: 0.28, phase: 0.4 },
  { x: 0.86, y: 0.52, phase: 2.1 },
  { x: 0.42, y: 1.02, phase: 4.3 },
];
const rings = 8;
const ringGap = 22;
const samples = 48;

function ring(cx: number, cy: number, radius: number, phase: number) {
  const points = Array.from({ length: samples }, (_, index) => {
    const angle = (index / samples) * Math.PI * 2;
    const wobble =
      1 +
      0.14 * Math.sin(3 * angle + phase) +
      0.07 * Math.sin(5 * angle - phase * 1.7);
    return [
      cx + Math.cos(angle) * radius * wobble,
      cy + Math.sin(angle) * radius * wobble * 0.82,
    ] as const;
  });
  const mid = (a: readonly number[], b: readonly number[]) =>
    `${((a[0]! + b[0]!) / 2).toFixed(1)} ${((a[1]! + b[1]!) / 2).toFixed(1)}`;
  const last = points[samples - 1]!;
  let d = `M${mid(last, points[0]!)}`;
  points.forEach((point, index) => {
    const next = points[(index + 1) % samples]!;
    d += ` Q${point[0].toFixed(1)} ${point[1].toFixed(1)} ${mid(point, next)}`;
  });
  return `${d} Z`;
}

export function contourPaths(width: number, height: number): string[] {
  return origins.flatMap((origin) =>
    Array.from({ length: rings }, (_, index) =>
      ring(
        origin.x * width,
        origin.y * height,
        ringGap * (index + 1),
        origin.phase + index * 0.35,
      ),
    ),
  );
}
