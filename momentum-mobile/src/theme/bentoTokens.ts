// src/theme/bentoTokens.ts
//
// Compatibility shim — the design tokens now live in `momentum-shared/tokens`.
// This file re-exports them with the historical `bentoPalette` / `familyPalette`
// names that the 24 existing consumers in src/screens/** import, so we can move
// the source of truth without touching every callsite.
//
// New code should still import from here; the shared package is an implementation
// detail. Mobile-only layout config (widgetSizes, dockConfig, etc.) moved to
// `./layout.ts` — import from there if you need it.
//
// Eventually, after web has migrated and we know we don't need the
// `bentoPalette` alias, we can flip consumers to `import { colors } from 'momentum-shared'`
// and delete this shim.

export {
  colors as bentoPalette,
  familyColors as familyPalette,
  spacing,
  borderRadius,
  typography,
  fontFamilies,
  animations,
  haptics,
  shadows,
} from 'momentum-shared';

export type {
  Spacing,
  BorderRadius,
  TypographyToken as Typography,
  ColorToken as BentoColor,
  Shadow,
  Animation,
  Haptic,
} from 'momentum-shared';
