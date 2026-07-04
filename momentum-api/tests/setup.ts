// Runs BEFORE any source code is imported. Establishes the env vars that
// src/server.ts and src/config/constants.ts assert on at module load.
//
// MONGO_URI is set here but will be overwritten at runtime by the
// mongodb-memory-server lifecycle in tests/helpers/db.ts. The placeholder
// just keeps the env-validation in server.ts happy if anything ever inspects
// it before the helper rewires it.

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-must-be-long-enough-for-jsonwebtoken-checks';
process.env.JWT_EXPIRES_IN = '1h';
process.env.MONGO_URI = 'mongodb://placeholder-replaced-by-memory-server';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
process.env.GOOGLE_REDIRECT_URI = 'http://localhost:3000/auth/google/callback';
process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
process.env.LOG_LEVEL = 'error';
