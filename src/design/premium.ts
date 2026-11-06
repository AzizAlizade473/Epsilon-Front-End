import { colors } from './tokens';

export const premium = {
  canvas: '#F7F7FA',
  foodCanvas: '#F2F0EB',
  night: '#14142F',
  nightRaised: '#202044',
  nightText: '#B8CAFF',
  heroHeight: 212,
  dishHeight: 156,
  dishDetailHeight: 260,
  thumb: 88,
  photoRadius: 24,
  shadow: {
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 2,
  },
} as const;
