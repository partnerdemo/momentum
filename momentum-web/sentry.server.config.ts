// sentry.server.config.ts
//
// Sentry init for the Node.js server runtime (route handlers, RSC).
// Reads DSN from SENTRY_DSN (server-only — must NOT be NEXT_PUBLIC_).

import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
    sendDefaultPii: false,
    initialScope: {
      tags: { service: 'momentum-web', runtime: 'nodejs' },
    },
  });
}
