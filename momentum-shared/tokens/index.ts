/**
 * Design tokens — single source of truth for the Momentum visual system.
 *
 * Both web and mobile import from here. Hard-coding hex/spacing/font sizes
 * outside this directory is a regression — add a token here first.
 *
 * Migration status (2026-06-14):
 *  - momentum-mobile: still uses local `src/theme/bentoTokens.ts`. Should be
 *    replaced with `import { colors, spacing, ... } from 'momentum-shared'`.
 *  - momentum-web: still hard-codes hex in `app/global.css @theme`. Should
 *    derive from this package via a CSS-var generation step at build time.
 *  - momentum-mobile/src/theme/colors.ts (legacy Tailwind-style ramps) and
 *    momentum-mobile/src/theme/typography.ts (scale-based) should be deleted
 *    once consumers stop importing from them.
 */

export * from './colors';
export * from './spacing';
export * from './radius';
export * from './typography';
export * from './motion';
export * from './shadows';
