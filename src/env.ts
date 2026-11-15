/**
 * Server-side environment entry point.
 *
 * Validated once at import: a misconfigured deployment fails loudly at boot with the exact variable
 * name, never silently at the first request. `server-only` guarantees this module can never be
 * pulled into a client bundle, so a secret cannot leak to the browser by accident.
 *
 * The schemas themselves live in `@/env-schema` so CLI tooling that runs outside the Next runtime
 * (the seeder, future workers) can validate the same contract without this guard.
 */

import "server-only";

import {
  assertProductionSafety,
  clientSchema,
  parseClientEnv,
  parseServerEnv,
  type ClientEnv,
  type ServerEnv,
} from "@/env-schema";

export type { ClientEnv, ServerEnv };

export const env: ServerEnv = parseServerEnv(process.env);
export const publicEnv: ClientEnv = parseClientEnv(process.env);

assertProductionSafety(env);

/** True when Google OAuth is fully configured; the login button is hidden otherwise (P02-T03). */
export const isGoogleOAuthEnabled =
  env.GOOGLE_CLIENT_ID !== undefined && env.GOOGLE_CLIENT_SECRET !== undefined;

/** True when Stripe is configured; checkout is unavailable (and says so) otherwise. */
export const isStripeEnabled =
  env.STRIPE_SECRET_KEY !== undefined && publicEnv.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY !== undefined;

/** Re-exported so consumers can assert the public contract without importing the Zod schemas. */
export { clientSchema };
