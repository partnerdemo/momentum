// src/config/sentry.ts
//
// Sentry init for the Expo / React Native client. Reads DSN from
// EXPO_PUBLIC_SENTRY_DSN — without it, every Sentry.* call is a no-op so
// local dev and Expo Go usage don't need any setup.
//
// IMPORTANT — for production builds:
//   1. EAS must run `expo prebuild` (or use the Sentry config plugin)
//      so the native iOS/Android Sentry SDKs are linked.
//   2. Add the @sentry/react-native plugin to app.json's "plugins" array.
//      That edit is deferred here because app.json is currently dirty WIP;
//      add when committing:
//        "plugins": [..., "@sentry/react-native"]
//   3. Set EXPO_PUBLIC_SENTRY_DSN in EAS environment.
//
// In Expo Go (no native modules) Sentry runs in JS-only mode and captures
// JS errors but not native crashes. That's fine for dev.

import * as Sentry from '@sentry/react-native';

let initialized = false;

export function initSentry(): void {
  if (initialized) return;
  initialized = true;

  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.EXPO_PUBLIC_ENV || (__DEV__ ? 'development' : 'production'),
    tracesSampleRate: Number(process.env.EXPO_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
    // Don't auto-attach user PII; we set user explicitly from AuthContext.
    sendDefaultPii: false,
    enableAutoSessionTracking: true,
    initialScope: {
      tags: { service: 'momentum-mobile' },
    },
  });
}

/**
 * Called from AuthContext when the user logs in / logs out / refreshes.
 * Pass `null` on logout to clear the user from the Sentry scope.
 */
export function setSentryUser(
  user: { id: string; householdId: string } | null,
): void {
  if (!initialized) return;
  if (user === null) {
    Sentry.setUser(null);
    Sentry.setTag('householdId', null);
    return;
  }
  Sentry.setUser({ id: user.id });
  Sentry.setTag('householdId', user.householdId);
}

export { Sentry };
