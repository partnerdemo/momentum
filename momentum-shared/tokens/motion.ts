/**
 * Motion tokens — animation timing and feel. Mobile uses these directly with
 * Reanimated; web should consume them as transition durations.
 */

export const animations = {
  springBounce: { type: 'spring' as const, damping: 15, stiffness: 200, mass: 1 },
  bouncySpring: { type: 'spring' as const, damping: 12, stiffness: 180, mass: 1.2 },
  quickSpring: { type: 'spring' as const, damping: 20, stiffness: 300, mass: 0.5 },
  smoothTiming: { type: 'timing' as const, duration: 300, useNativeDriver: true },
  scalePress: { pressed: 0.96, released: 1.0 },
  squishPress: { pressed: 0.9, released: 1.0 },
  rotation: { plus: '0deg', close: '45deg' },
} as const;

/**
 * Haptic intensity tokens. Mobile maps these to Expo Haptics constants.
 * Web has no haptic equivalent — pair with visual/audio feedback instead.
 */
export const haptics = {
  light: 'light' as const,
  medium: 'medium' as const,
  heavy: 'heavy' as const,
  selection: 'selection' as const,
  success: 'notificationSuccess' as const,
  warning: 'notificationWarning' as const,
  error: 'notificationError' as const,
} as const;

export type Animation = keyof typeof animations;
export type Haptic = (typeof haptics)[keyof typeof haptics];
