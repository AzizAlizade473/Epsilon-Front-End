import { describe, expect, test } from '@jest/globals';

import {
  colors,
  layout,
  motionTokens,
  radius,
  resolveMotion,
  spacing,
  theme,
  typography,
} from '@/design';

describe('design tokens', () => {
  test('exposes brand and semantic colors from the spec', () => {
    expect(colors.brand.primary).toBe('#2563EB');
    expect(colors.brand.primaryPressed).toBe('#1D4ED8');
    expect(colors.brand.tint).toBe('#EFF6FF');
    expect(colors.brand.border).toBe('#BFDBFE');
    expect(colors.ink).toBe('#0F172A');
    expect(colors.inkSecondary).toBe('#64748B');
    expect(colors.inkMuted).toBe('#94A3B8');
    expect(colors.background).toBe('#F7F8FA');
    expect(colors.surface).toBe('#FFFFFF');
    expect(colors.border).toBe('#E2E8F0');
    expect(colors.divider).toBe('#F1F5F9');
    expect(colors.success).toBe('#16A34A');
    expect(colors.successTint).toBe('#ECFDF5');
    expect(colors.warning).toBe('#D97706');
    expect(colors.warningTint).toBe('#FFF7ED');
    expect(colors.danger).toBe('#DC2626');
    expect(colors.dangerTint).toBe('#FEE2E2');
    expect(colors.overlay).toBe('rgba(15,23,42,0.5)');
    expect(colors.scanDim).toBe('rgba(0,0,0,0.6)');
  });

  test('exposes spacing, radius, and layout constants', () => {
    expect(spacing).toEqual({
      4: 4,
      8: 8,
      12: 12,
      16: 16,
      20: 20,
      24: 24,
      32: 32,
      48: 48,
      screenMargin: 20,
    });
    expect(radius).toEqual({
      12: 12,
      16: 16,
      20: 20,
      24: 24,
      pill: 9999,
    });
    expect(layout.contentMaxWidth).toBe(480);
    expect(layout.designWidth).toBe(360);
    expect(layout.tapTarget).toBe(44);
  });

  test('typography sizes match the spec', () => {
    expect(typography.display).toMatchObject({
      fontSize: 56,
      lineHeight: 60,
      fontWeight: '700',
      letterSpacing: -1.5,
    });
    expect(typography.title1.fontSize).toBe(32);
    expect(typography.title2.fontSize).toBe(24);
    expect(typography.headline).toMatchObject({
      fontSize: 17,
      fontWeight: '600',
    });
    expect(typography.body.fontSize).toBe(16);
    expect(typography.callout.fontSize).toBe(15);
    expect(typography.caption.fontSize).toBe(13);
    expect(typography.tab.fontSize).toBe(11);
  });

  test('theme composes tokens and keeps dark status-bar icons', () => {
    expect(theme.colors).toBe(colors);
    expect(theme.typography).toBe(typography);
    expect(theme.motion).toBe(motionTokens);
    expect(theme.statusBarStyle).toBe('dark');
  });
});

describe('resolveMotion', () => {
  test('returns full motion values by default', () => {
    const motion = resolveMotion(false);
    expect(motion).toMatchObject({
      duration: { fast: 120, normal: 200, slow: 320 },
      pressScale: 0.97,
      listStagger: 40,
      listStaggerMax: 8,
      spring: { damping: 20, stiffness: 260, mass: 1 },
      reduceMotion: false,
    });
  });

  test('collapses to instant values when Reduce Motion is on', () => {
    const motion = resolveMotion(true);
    expect(motion.duration).toEqual({ fast: 0, normal: 0, slow: 0 });
    expect(motion.pressScale).toBe(1);
    expect(motion.listStagger).toBe(0);
    expect(motion.reduceMotion).toBe(true);
  });
});
