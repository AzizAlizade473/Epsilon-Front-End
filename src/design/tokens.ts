/**
 * Design tokens — the only place raw visual values live (UX-1).
 * Brand primary `#2563EB` is a placeholder; TODO replace with exact logo color.
 */

export const colors = {
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
  hairlineWidth: 1,
} as const;

export type ColorToken = typeof colors;
export type SpacingToken = typeof spacing;
export type RadiusToken = typeof radius;
