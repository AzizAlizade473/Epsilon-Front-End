import { colors, radius, spacing } from './tokens';

/** Website anchors; darker/lighter tones are mobile contrast adaptations. */
export const walletDesign = {
  colors: {
    canvas: '#14142F',
    raised: '#202044',
    line: '#39395B',
    muted: '#B8CAFF',
    card: colors.brand.secondary,
    fold: colors.brand.accent,
    back: colors.brand.primary,
    sheen: '#FFFFFF14',
    positive: '#A7EACB',
    text: colors.surface,
  },
  card: { radius: radius[24], inset: spacing[12], lift: spacing[8], turn: 3 },
  spring: { damping: 23, stiffness: 210, mass: 0.85 },
  rise: 24,
  stagger: 55,
  settle: 420,
  transitionTimeout: 1200,
  successSize: 88,
  successDuration: 650,
} as const;
