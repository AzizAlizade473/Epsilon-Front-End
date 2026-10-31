import { expect, test } from '@jest/globals';

import { colors } from '@/design';

function luminance(hex: string): number {
  const channel = (offset: number) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return channel(1) * 0.2126 + channel(3) * 0.7152 + channel(5) * 0.0722;
}

test.each([
  ['body/helpers on screen', colors.ink, colors.background],
  ['body on surface', colors.ink, colors.surface],
  ['secondary on white only', colors.inkSecondary, colors.surface],
  ['error on screen', colors.danger, colors.background],
  ['primary button', colors.surface, colors.brand.primary],
  ['secondary button', colors.brand.primary, colors.brand.tint],
  ['destructive button', colors.surface, colors.danger],
  ['toast', colors.surface, colors.ink],
  ['warning chip', colors.ink, colors.warningTint],
  ['success chip', colors.ink, colors.successTint],
  ['danger chip', colors.ink, colors.dangerTint],
])('%s text meets WCAG 4.5:1', (_context, foreground, background) => {
  const first = luminance(foreground);
  const second = luminance(background);
  const ratio =
    (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
  expect(ratio).toBeGreaterThanOrEqual(4.5);
});
