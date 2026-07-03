/**
 * Shadow tokens — three named elevations.
 *
 * Mobile uses the full object directly (React Native shadow + elevation).
 * Web should convert to a CSS `box-shadow` string at consumption time.
 */

export const shadows = {
  soft: {
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  float: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  deep: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
} as const;

export type Shadow = keyof typeof shadows;
