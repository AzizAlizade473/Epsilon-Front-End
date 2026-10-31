import { motionTokens } from './motion';
import { colors, layout, radius, spacing } from './tokens';
import { typography } from './typography';

/**
 * Composed light theme. v1 is light-only; OS dark mode still uses these values.
 */
export const theme = {
  colors,
  spacing,
  radius,
  typography,
  motion: motionTokens,
  layout,
  statusBarStyle: 'dark' as const,
} as const;

export type Theme = typeof theme;
