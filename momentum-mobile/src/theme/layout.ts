// src/theme/layout.ts
//
// Mobile-only layout / interaction tokens that DON'T belong in momentum-shared
// because they're React Native-specific (touch target, dock blur, dimensions).
//
// Spacing comes from the shared source of truth so a single number drives both
// the gutter between cards and the gap between buttons.

import { spacing } from 'momentum-shared';

export const widgetSizes = {
  columns: 2,
  gutter: spacing.lg,
  outerPadding: spacing.xl,
  aspectRatios: { hero: 2.5, standard: 1.2, wide: 3.5, tall: 0.6 },
} as const;

export const dockConfig = {
  height: 64,
  bottomOffset: spacing.xxxl,
  blur: 30,
  opacity: 0.85,
  borderWidth: 1,
  iconSize: 24,
  createButtonSize: 56,
} as const;

export const breakpoints = { mobile: 0, tablet: 768, desktop: 1024 } as const;

export const zIndex = {
  base: 0,
  card: 1,
  cardExpanded: 10,
  dock: 100,
  modal: 1000,
  toast: 2000,
} as const;

export const a11y = {
  minTouchTarget: 44,
  minContrast: 4.5,
  focusRingWidth: 2,
  // Mirror momentum-shared's brandPrimary — duplicated here only because this
  // file is consumed in non-React contexts (StyleSheet.create) where importing
  // the full colors object is overkill.
  focusRingColor: '#6366F1',
} as const;

export type WidgetSize = keyof typeof widgetSizes.aspectRatios;
