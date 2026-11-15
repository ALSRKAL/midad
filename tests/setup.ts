import "@testing-library/jest-dom/vitest";

/**
 * Deterministic environment for unit and integration tests.
 *
 * `src/env.ts` validates the environment at import time (that is the point of it), so tests must
 * provide a complete, obviously fake environment before any module that touches it is loaded.
 * Nothing here points at a real service: unit tests never open a connection, and integration
 * suites self-skip unless the dedicated test database is reachable.
 */
process.env = {
  ...process.env,
  NODE_ENV: "test",
  LOG_LEVEL: "error",
};
process.env.APP_URL = "http://localhost:3000";
// Integration suites need a migrated, disposable database. CI passes one explicitly; the fallback
// matches the test database exposed by the local docker test stack.
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgresql://midad:midad@localhost:5433/midad_test";
process.env.REDIS_URL = "redis://localhost:6380/1";
process.env.S3_ENDPOINT = "http://localhost:9000";
process.env.S3_ACCESS_KEY_ID = "test-access-key";
process.env.S3_SECRET_ACCESS_KEY = "test-secret-key";
process.env.S3_BUCKET_PUBLIC = "midad-public";
process.env.S3_BUCKET_PRIVATE = "midad-media";
process.env.AUTH_SECRET = "test-only-secret-value-that-is-long-enough";
process.env.AUTH_EMAIL_FROM = "no-reply@midad.test";
process.env.SMTP_HOST = "localhost";
process.env.SMTP_PORT = "1025";
process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
