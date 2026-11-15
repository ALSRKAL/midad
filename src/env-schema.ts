/**
 * The environment contract, as a pure module: Zod schemas plus the parse functions.
 *
 * This file has **no side effects** and deliberately does not import `server-only`, so command-line
 * tooling that runs outside the Next.js runtime (the seeder, the migration script, future workers)
 * can validate the very same contract instead of re-declaring it.
 *
 * Application code must import `@/env` instead — that entry point adds the `server-only` guard and
 * runs the boot-time checks. `.env.example` documents every variable line by line.
 */

import { z } from "zod";

/* ------------------------------------------------------------------ *
 * Helpers                                                             *
 * ------------------------------------------------------------------ */

const booleanish = z
  .enum(["true", "false", "1", "0"])
  .transform((value) => value === "true" || value === "1");

const port = z.coerce.number().int().min(1).max(65535);

/** An unset/empty variable counts as absent, not as an empty string. */
const optionalString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().min(1).optional(),
);

/* ------------------------------------------------------------------ *
 * Schemas                                                             *
 * ------------------------------------------------------------------ */

export const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Core
  APP_URL: z.url().default("http://localhost:3000"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),

  // Database & cache
  DATABASE_URL: z.string().min(1).startsWith("postgres"),
  REDIS_URL: z.string().min(1).startsWith("redis"),

  // Object storage (S3-compatible; MinIO locally)
  S3_ENDPOINT: z.url(),
  S3_REGION: z.string().min(1).default("us-east-1"),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  S3_BUCKET_PUBLIC: z.string().min(1),
  S3_BUCKET_PRIVATE: z.string().min(1),
  /** MinIO and most self-hosted gateways need path-style addressing. */
  S3_FORCE_PATH_STYLE: booleanish.default(true),
  /** Lifetime of a signed content URL, in seconds (BR-20: 900 = 15 minutes). */
  S3_SIGNED_URL_TTL_SEC: z.coerce.number().int().min(60).max(86_400).default(900),

  // Auth
  AUTH_SECRET: z.string().min(32, "must be at least 32 characters of randomness"),
  GOOGLE_CLIENT_ID: optionalString,
  GOOGLE_CLIENT_SECRET: optionalString,
  /** From address used for verification and reset emails. */
  AUTH_EMAIL_FROM: z.email().default("no-reply@midad.example"),
  /** Better Auth's per-IP window for authentication endpoints (the product requirements: 5/min). */
  AUTH_RATE_LIMIT_WINDOW_SEC: z.coerce.number().int().min(1).max(3600).default(60),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(1000).default(5),

  // Email
  SMTP_HOST: z.string().min(1).default("localhost"),
  SMTP_PORT: port.default(1025),
  SMTP_USER: optionalString,
  SMTP_PASSWORD: optionalString,
  SMTP_SECURE: booleanish.default(false),
  RESEND_API_KEY: optionalString,

  // Payments (required for checkout; the app boots without them so the catalog is usable)
  STRIPE_SECRET_KEY: optionalString,
  STRIPE_WEBHOOK_SECRET: optionalString,
  /** Test-only Stripe API substitute; never set in production (assertProductionSafety rejects it). */
  STRIPE_API_BASE: z.url().optional(),

  // Video pipeline
  VIDEO_PROVIDER: z.enum(["hls", "mux"]).default("hls"),
  MUX_TOKEN_ID: optionalString,
  MUX_TOKEN_SECRET: optionalString,
  FFMPEG_PATH: z.string().min(1).default("ffmpeg"),

  // Worker
  WORKER_CONCURRENCY: z.coerce.number().int().min(1).max(64).default(4),
  /** Test-only clock offset for time-dependent rules (ADR-0007); rejected in production. */
  CLOCK_OFFSET_MS: z.coerce.number().int().default(0),

  // Product defaults
  DEFAULT_CURRENCY: z.enum(["SAR", "USD"]).default("SAR"),
  PLATFORM_COMMISSION_BPS: z.coerce.number().int().min(0).max(10_000).default(7000),
  VAT_BPS: z.coerce.number().int().min(0).max(10_000).default(1500),

  // Feature switches
  MAINTENANCE_MODE: booleanish.default(false),
  ALLOW_SEED_IN_PRODUCTION: booleanish.default(false),
});

export const clientSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
  NEXT_PUBLIC_DEFAULT_LOCALE: z.enum(["ar", "en"]).default("ar"),
  NEXT_PUBLIC_DEFAULT_CURRENCY: z.enum(["SAR", "USD"]).default("SAR"),
  /** Publishable key only — safe for the browser. The secret key stays server-side. */
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z
    .string()
    .regex(/^pk_(test|live)_/, "must be a Stripe publishable key (pk_test_... / pk_live_...)")
    .optional(),
});

export type ServerEnv = z.infer<typeof serverSchema>;
export type ClientEnv = z.infer<typeof clientSchema>;

/* ------------------------------------------------------------------ *
 * Parsing                                                             *
 * ------------------------------------------------------------------ */

/** One bullet per problem, used by both the boot error and the CLI tools. */
export function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const name = issue.path.join(".") || "(root)";
      return `  • ${name}: ${issue.message}`;
    })
    .join("\n");
}

/** Human-readable boot failure, shared by the app and the CLI tools. */
export function environmentError(error: z.ZodError): string {
  return [
    "",
    "╭─ Midad refused to start: invalid environment ─────────────────────────────",
    "│ The following variables are missing or malformed:",
    formatIssues(error),
    "│",
    "│ Fix: copy .env.example to .env.local and fill in the values, then restart.",
    "│ Every variable is documented line by line in .env.example.",
    "╰───────────────────────────────────────────────────────────────────────────",
    "",
  ].join("\n");
}

export type EnvSource = Record<string, string | undefined>;

export function parseServerEnv(source: EnvSource): ServerEnv {
  const parsed = serverSchema.safeParse(source);
  if (!parsed.success) throw new Error(environmentError(parsed.error));
  return parsed.data;
}

export function parseClientEnv(source: EnvSource): ClientEnv {
  const parsed = clientSchema.safeParse({
    NEXT_PUBLIC_SITE_URL: source.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_DEFAULT_LOCALE: source.NEXT_PUBLIC_DEFAULT_LOCALE,
    NEXT_PUBLIC_DEFAULT_CURRENCY: source.NEXT_PUBLIC_DEFAULT_CURRENCY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: source.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  });
  if (!parsed.success) {
    throw new Error(
      `Midad refused to start: invalid public environment\n${formatIssues(parsed.error)}`,
    );
  }
  return parsed.data;
}

/**
 * Boot-time guard rails that apply to every runtime, including the seeder and workers.
 * ADR-0007: the clock offset exists for tests and must never be deployed.
 */
export function assertProductionSafety(env: ServerEnv): void {
  if (env.NODE_ENV !== "production") return;
  if (env.CLOCK_OFFSET_MS !== 0) {
    throw new Error("CLOCK_OFFSET_MS must be 0 in production (see ADR-0007).");
  }
  if (env.ALLOW_SEED_IN_PRODUCTION) {
    throw new Error("ALLOW_SEED_IN_PRODUCTION must be false in production.");
  }
  if (env.STRIPE_API_BASE !== undefined) {
    const host = new URL(env.STRIPE_API_BASE).hostname;
    if (host !== "127.0.0.1" && host !== "localhost" && host !== "::1") {
      throw new Error("STRIPE_API_BASE may only point at a loopback test gateway.");
    }
  }
}
