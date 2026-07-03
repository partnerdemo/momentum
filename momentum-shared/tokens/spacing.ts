/**
 * Spacing scale — single source of truth for layout gaps, padding, margins.
 * Values in points (mobile) / pixels (web). Per the bento system.
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  massive: 48,
  giant: 64,
} as const;

export type Spacing = keyof typeof spacing;
