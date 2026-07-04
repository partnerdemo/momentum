// src/config/sentry.ts
//
// Sentry initialization for the Core API. Driven entirely by env vars so
// local dev and tests stay no-op. If SENTRY_DSN is unset, every Sentry
// call below is a safe no-op (per @sentry/node 8.x behavior).
//
// Must be imported and called BEFORE any other module that you want to
// instrument — Sentry uses OpenTelemetry hooks that need to register early.
// In server.ts the import is placed at the very top, right after dotenv.

import * as Sentry from '@sentry/node';

let initialized = false;

export function initSentry(): void {
  if (initialized) return;
  initialized = true;

  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    // No DSN configured — leave Sentry uninitialized. All Sentry.* calls
    // become no-ops, which is what we want for local dev and tests.
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.SENTRY_RELEASE || undefined,
    // Server-side perf: sample 10% by default; SENTRY_TRACES_SAMPLE_RATE overrides.
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
    // Don't send PII unless explicitly allowed
    sendDefaultPii: false,
    // Tag every event with the service name so the BFF and Core don't blur together
    initialScope: {
      tags: { service: 'momentum-api' },
    },
  });
}

/**
 * Attach the current authenticated user + household to the Sentry scope so
 * any error captured during this request is tagged with who hit it.
 * Called from authMiddleware after a successful JWT verify.
 */
export function setSentryUser(userId: string, householdId: string): void {
  if (!initialized) return;
  Sentry.setUser({ id: userId });
  Sentry.setTag('householdId', householdId);
}

export { Sentry };
