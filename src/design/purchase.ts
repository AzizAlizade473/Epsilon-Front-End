import { colors, typography } from './index';

/** Review direction, scoped to Home, wallet and the verified-purchase journey. */
export const purchaseDesign = {
  canvas: colors.surface,
  ink: colors.brand.primary,
  paper: colors.brand.tint,
  headline: {
    ...typography.title1,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -1.1,
  },
  balance: {
    ...typography.display,
    fontSize: 60,
    lineHeight: 68,
    letterSpacing: -2,
  },
  ordinal: {
    ...typography.title1,
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '400' as const,
  },
  artHeight: 172,
  scanArtWidth: 152,
  dishSize: 88,
  stampSize: 104,
  binding: 8,
  progressHeight: 4,
  slipRadius: 4,
} as const;
