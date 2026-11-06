import { colors, typography } from './index';

/** Adapted from Epsilon@8f133b0: HomeScreen.tsx, ProductCard.tsx, FeedbackModal.tsx.
 * Original composition/neutral/star colors; Epsilon blue replaces OBA branding.
 * Small labels and targets are enlarged to retain current accessibility rules.
 */
export const originalReceipts = {
  colors: {
    canvas: '#F8F9FB',
    surface: '#FFFFFF',
    ink: '#111827',
    secondary: '#6B7280',
    border: '#F3F4F6',
    soft: '#F9FAFB',
    star: '#D4F238',
    emptyStar: '#E5E7EB',
    selected: '#1A1A1A',
    rated: '#047857',
    ratedTint: '#F0FDF4',
    pending: '#9A3412',
    pendingTint: '#FFF7ED',
    food: '#92400E',
    foodTint: '#FEF3C7',
    drink: '#7C3AED',
    drinkTint: '#EDE9FE',
    primary: colors.brand.primary,
    primaryTint: colors.brand.tint,
    overlay: 'rgba(26,26,26,0.6)',
  },
  type: {
    title: {
      ...typography.title2,
      fontSize: 20,
      lineHeight: 26,
      fontWeight: '700' as const,
    },
    amount: {
      ...typography.title2,
      fontSize: 26,
      lineHeight: 32,
      fontWeight: '800' as const,
    },
    product: {
      ...typography.callout,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '700' as const,
    },
    caption: {
      ...typography.caption,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '500' as const,
    },
  },
  radius: { card: 20, dish: 16, icon: 12, sheet: 32, chip: 12, badge: 6 },
  size: { date: 48, icon: 48, star: 20, modalStar: 32, target: 44, handle: 48 },
  receiptHeightRatio: 0.7,
  shadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  dishShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  feedbackMotion: {
    rise: 10,
    scale: 0.98,
    duration: 180,
    damping: 20,
    stiffness: 300,
  },
} as const;
