/**
 * Typography — semantic text styles. Use these names everywhere instead of
 * raw fontSize/fontFamily values, so a rebrand changes one file.
 *
 * Inter is the only font family. Mobile loads it via @expo-google-fonts/inter;
 * web loads it via a Google Fonts @import in global.css. The named families
 * map to the appropriate weight on each platform.
 */

export const fontFamilies = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semiBold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
} as const;

export const typography = {
  widgetTitle: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0,
  },
  heroGreeting: {
    fontFamily: fontFamilies.bold,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: 0,
  },
  bigNumber: {
    fontFamily: fontFamilies.bold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  body: {
    fontFamily: fontFamilies.medium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
  },
  caption: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  button: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
  },
} as const;

export type TypographyToken = keyof typeof typography;
export type FontFamily = keyof typeof fontFamilies;
