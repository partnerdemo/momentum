const { createDefaultPreset } = require('ts-jest');

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/setup.ts'],
  transform: {
    ...tsJestTransformCfg,
  },
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  testTimeout: 30000,
  // mongodb-memory-server first download can be slow — be patient
  // Run serially so one test's DB writes don't bleed into another's via the shared connection
  maxWorkers: 1,
};
