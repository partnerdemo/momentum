// =========================================================
// momentum-web/next.config.mjs
// Next.js config + Sentry wrapper.
// =========================================================

import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['momentum-shared'],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

// Sentry build-time config. The wrapper is a no-op at runtime if
// SENTRY_DSN is unset; build-time source-map upload only runs when
// SENTRY_AUTH_TOKEN + SENTRY_ORG + SENTRY_PROJECT are all set.
const sentryBuildOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Silence build noise unless explicitly opted in
  silent: !process.env.CI,
  // Skip source map upload locally — set SENTRY_AUTH_TOKEN in CI to enable.
  disableLogger: true,
  widenClientFileUpload: true,
};

export default process.env.SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryBuildOptions)
  : nextConfig;
