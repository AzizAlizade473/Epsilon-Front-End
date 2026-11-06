import { colors, radius, spacing } from './tokens';

/** Website anchors; darker/lighter tones are mobile contrast adaptations. */
export const walletDesign = {
  colors: {
    canvas: colors.background,
    raised: colors.surface,
    line: colors.border,
    muted: colors.inkSecondary,
    card: colors.brand.primary,
    fold: colors.brand.accent,
    back: colors.brand.primary,
    sheen: '#FFFFFF14',
    positive: colors.successInk,
    text: colors.ink,
  },
  card: { radius: radius[24], inset: spacing[12], lift: spacing[8], turn: 3 },
  spring: { damping: 23, stiffness: 210, mass: 0.85 },
  rise: 8,
  stagger: 30,
  settle: 420,
  transitionTimeout: 1200,
  successSize: 88,
  successDuration: 650,
} as const;
