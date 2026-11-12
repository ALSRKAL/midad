/**
 * Stub for the `server-only` guard under Vitest.
 *
 * The real package throws when imported outside the Next.js server runtime. Unit and
 * integration tests import services and lib modules directly, so the guard is replaced by an
 * empty module here — it stays fully active in the application build.
 */
export {};
