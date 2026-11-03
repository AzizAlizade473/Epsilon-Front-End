import { StyleSheet } from 'react-native';

/**
 * Design tokens — the only place raw visual values live (UX-1).
 * Official epsilonup.com/style.css palette, verified against computed styles.
 * Tint/border are mobile tonal adaptations; brand anchors remain exact.
 */

export const colors = {
  transparent: 'transparent',
  cameraBackground: '#000000',
  brand: {
    primary: '#282973',
    secondary: '#2F67B2',
    accent: '#534C9C',
    primaryPressed: '#1A1A4E',
    tint: '#EEEFF7',
    border: '#D4D5E8',
    deep: '#282973',
    deepRaised: '#2F3D8F',
    onDeep: '#B8CAFF',
  },
  ink: '#333333',
  inkSecondary: '#555555',
  inkMuted: '#888888',
  background: '#FAF4F5',
  surface: '#FFFFFF',
  border: '#E8E8E8',
  divider: '#F4F4F7',
  paper: '#EEEFF7',
  paperInk: '#534C9C',
  success: '#16A34A',
  successInk: '#1A7F4B',
  successTint: '#D4F7E7',
  warning: '#D97706',
  warningTint: '#FFF7ED',
  danger: '#B91C1C',
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
  artHeight: 248,
  artSmallHeight: 156,
  partnerMarkSize: 88,
  receiptNotch: 12,
  borderWidth: 1,
  designWidth: 360,
  tapTarget: 44,
  iconStrokeWidth: 1.8,
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
  authLogoSize: 120,
  welcomeLogoSize: 44,
  wordmarkWidth: 132,
  wordmarkHeight: 44,
  welcomeArtWidth: 360,
  welcomeArtHeight: 248,
  welcomeArtRise: 12,
  ratingStarSize: 48,
  leadingIconSize: 40,
  disabledOpacity: 0.5,
  currencyScale: 0.6,
  skeletonMinOpacity: 0.5,
  skeletonPulseDuration: 900,
  toastDuration: 4000,
  reconnectDuration: 1500,
  otpBusyOpacity: 0.6,
  otpShakeDistance: 8,
  otpShakeDuration: 240,
  hairlineWidth: StyleSheet.hairlineWidth,
} as const;

export type ColorToken = typeof colors;
export type SpacingToken = typeof spacing;
export type RadiusToken = typeof radius;
