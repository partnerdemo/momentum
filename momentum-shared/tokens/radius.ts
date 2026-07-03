/**
 * Border radius scale. `xl` (24) is "The Squish" — the signature rounded
 * card edge used across the bento UI.
 */

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  round: 32,
  pill: 9999,
} as const;

export type BorderRadius = keyof typeof borderRadius;
