import type { TextStyle } from 'react-native';

/**
 * Platform system font (Roboto on Android). No custom font families in v1.
 * Tab is the only size allowed below 13 (tab labels only).
 */
export const fontFamily = undefined;

export const typography = {
  display: {
    fontFamily,
    fontSize: 56,
    lineHeight: 60,
    fontWeight: '700',
    letterSpacing: -1.5,
  },
  title1: {
    fontFamily,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
    letterSpacing: 0,
  },
  title2: {
    fontFamily,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    letterSpacing: 0,
  },
  headline: {
    fontFamily,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: 0,
  },
  body: {
    fontFamily,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400',
    letterSpacing: 0,
  },
  callout: {
    fontFamily,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500',
    letterSpacing: 0,
  },
  caption: {
    fontFamily,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    letterSpacing: 0,
  },
  /** Tab labels only — do not use elsewhere. */
  tab: {
    fontFamily,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
    letterSpacing: 0,
  },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
