/**
 * SEMANTIC COLOR PALETTE — the single source of truth for Momentum brand colors.
 *
 * Both web (`momentum-web/app/global.css`) and mobile (`momentum-mobile/src/theme/bentoTokens.ts`)
 * MUST derive their color values from this file. Do not hard-code hex anywhere
 * else — if you need a new semantic role, add it here first.
 *
 * Values originate from the mobile bento system circa 2026-06-14, which the
 * design philosophy ("Disney Adult with ADHD", structured whimsy, premium
 * polish) was originally calibrated against. Web had drifted to slightly
 * different hex values for `success` (#16A34A) and `error` (#DC2626);
 * we align everything on these canonical values.
 */

export const colors = {
  // Surfaces
  canvas: '#FFF9F5',
  surface: '#FFFFFF',
  glassWhite: 'rgba(255, 255, 255, 0.85)',
  glassBorder: 'rgba(255, 255, 255, 0.5)',

  // Text
  textPrimary: '#1C1917',
  textSecondary: '#57534E',
  textTertiary: '#A8A29E',

  // Brand
  brandPrimary: '#6366F1',
  brandLight: '#818CF8',
  brandDark: '#4F46E5',

  // Signals
  success: '#10B981',
  successLight: '#ECFDF5',
  alert: '#F59E0B',
  alertLight: '#FFFBEB',
  error: '#EF4444',
  errorLight: '#FEF2F2',

  // Structural
  borderSubtle: '#E5E7EB',
} as const;

/**
 * Family/feature accent colors used in the gamification surfaces.
 * These are deliberately distinct from the semantic palette above.
 */
export const familyColors = {
  questGradient: ['#F59E0B', '#7C3AED'] as const,
  taskBlue: '#38BDF8',
  streakFire: '#EF4444',
  coinGold: '#FBBF24',
} as const;

export type ColorToken = keyof typeof colors;
export type FamilyColorToken = keyof typeof familyColors;
