// sentry.client.config.ts
//
// Sentry init for the browser bundle. Reads DSN from NEXT_PUBLIC_SENTRY_DSN.
// Without it, every Sentry.* call is a no-op so local dev is friction-free.

import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_ENV || process.env.NODE_ENV || 'development',
    tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
    replaysSessionSampleRate: 0, // off by default — privacy
    replaysOnErrorSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_REPLAY_ERROR_RATE ?? '0'),
    sendDefaultPii: false,
    initialScope: {
      tags: { service: 'momentum-web' },
    },
  });
}
