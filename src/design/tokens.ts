import { StyleSheet } from 'react-native';

/**
 * Design tokens — the only place raw visual values live (UX-1).
 * Brand primary `#2563EB` is a placeholder; TODO replace with exact logo color.
 */

export const colors = {
  transparent: 'transparent',
  cameraBackground: '#000000',
  brand: {
    primary: '#2563EB',
    primaryPressed: '#1D4ED8',
    tint: '#EFF6FF',
    border: '#BFDBFE',
  },
  ink: '#0F172A',
  inkSecondary: '#64748B',
  inkMuted: '#94A3B8',
  background: '#F7F8FA',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  divider: '#F1F5F9',
  success: '#16A34A',
  successInk: '#15803D',
  successTint: '#ECFDF5',
  warning: '#D97706',
  warningTint: '#FFF7ED',
  danger: '#DC2626',
  dangerTint: '#FEE2E2',
  overlay: 'rgba(15,23,42,0.5)',
  scanDim: 'rgba(0,0,0,0.6)',
} as const;

export const spacing = {
  4: 4,
  8: 8,
  12: 12,
  16: 16,
  20: 20,
  24: 24,
  32: 32,
  48: 48,
  screenMargin: 20,
} as const;

export const radius = {
  12: 12,
  16: 16,
  20: 20,
  24: 24,
  pill: 9999,
} as const;

export const layout = {
  contentMaxWidth: 480,
  designWidth: 360,
  tapTarget: 44,
  iconStrokeWidth: 2,
  controlHeight: 56,
  searchHeight: 48,
  balanceSkeletonWidth: 200,
  homeWordmarkSize: 28,
  profileAvatarSize: 64,
  tabBarHeight: 64,
  rowHeight: 52,
  detailRowHeight: 68,
  scanViewfinderSize: 260,
  scanBracketWidth: 3,
  scanLineWidth: 1,
  receiptLogoSize: 48,
  successMarkSize: 72,
  ratingStarSize: 48,
  leadingIconSize: 40,
  disabledOpacity: 0.5,
  currencyScale: 0.6,
  skeletonMinOpacity: 0.5,
  skeletonPulseDuration: 900,
  otpBusyOpacity: 0.6,
  otpShakeDistance: 8,
  otpShakeDuration: 240,
  hairlineWidth: StyleSheet.hairlineWidth,
} as const;

export type ColorToken = typeof colors;
export type SpacingToken = typeof spacing;
export type RadiusToken = typeof radius;
