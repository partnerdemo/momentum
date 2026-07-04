// src/config/sentry.ts
// Sentry init for the Mobile BFF. Mirrors momentum-api's setup; tag is
// `momentum-mobile-bff` so events land in a separate bucket from the Core.
//
// No-op when SENTRY_DSN is unset. Import + initSentry() must run BEFORE any
// other module so OpenTelemetry can register instrumentation early.

import * as Sentry from '@sentry/node';

let initialized = false;

export function initSentry(): void {
  if (initialized) return;
  initialized = true;

  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.SENTRY_RELEASE || undefined,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
    sendDefaultPii: false,
    initialScope: {
      tags: { service: 'momentum-mobile-bff' },
    },
  });
}

/**
 * Tag the Sentry scope with the authenticated user from a Bearer token.
 * BFF doesn't verify the JWT (the Core API does), but it can read the
 * `sub` claim opportunistically to attach context to errors. Wrap in try
 * so a malformed token never breaks request processing.
 */
export function setSentryUserFromAuthHeader(authHeader?: string): void {
  if (!initialized || !authHeader) return;
  try {
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    const parts = token.split('.');
    if (parts.length !== 3) return;
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8'),
    ) as { id?: string; householdId?: string };
    if (payload.id) Sentry.setUser({ id: payload.id });
    if (payload.householdId) Sentry.setTag('householdId', payload.householdId);
  } catch {
    // Silent — invalid token shape is the Core API's problem, not ours
  }
}

export { Sentry };
