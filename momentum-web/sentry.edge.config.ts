// sentry.edge.config.ts
//
// Sentry init for the Edge runtime (middleware, edge route handlers).
// Uses the same SENTRY_DSN as server config.

import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
    sendDefaultPii: false,
    initialScope: {
      tags: { service: 'momentum-web', runtime: 'edge' },
    },
  });
}
