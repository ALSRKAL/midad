import "server-only";

import { HeadBucketCommand } from "@aws-sdk/client-s3";

import { env } from "@/env";
import { db } from "@/server/db";
import { logger } from "@/server/logger";
import { verifyMailTransport } from "@/server/mailer";
import { storage } from "@/server/storage";

/**
 * Health check used by the deployment platform, Docker and CI smoke tests.
 *
 * Every dependency is probed with its own timeout, and a failure is reported per check rather than
 * as one opaque 500: an operator needs to know whether the database or the object store is down.
 * The endpoint leaks nothing (no versions, no connection strings, no error messages) and returns
 * 503 when any *required* dependency is unhealthy.
 */

export type HealthStatus = "ok" | "degraded";

export type CheckResult = {
  name: "database" | "redis" | "storage" | "mail";
  required: boolean;
  ok: boolean;
  durationMs: number;
  detail?: string;
};

const TIMEOUT_MS = 3_000;

async function withTimeout<T>(operation: Promise<T>, label: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${TIMEOUT_MS}ms`)),
      TIMEOUT_MS,
    );
  });
  try {
    return await Promise.race([operation, timeout]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

async function checkDatabase(): Promise<{ ok: boolean; detail?: string }> {
  await withTimeout(db.$queryRaw`SELECT 1`, "database");
  return { ok: true };
}

async function checkRedis(): Promise<{ ok: boolean; detail?: string }> {
  // A short-lived connection per probe: the health endpoint must not hold a pool open.
  const { default: Redis } = await import("ioredis");
  const client = new Redis(env.REDIS_URL, {
    lazyConnect: true,
    connectTimeout: TIMEOUT_MS,
    maxRetriesPerRequest: 1,
  });
  try {
    await withTimeout(client.connect(), "redis connect");
    const pong = await withTimeout(client.ping(), "redis ping");
    return { ok: pong === "PONG" };
  } finally {
    client.disconnect();
  }
}

async function checkStorage(): Promise<{ ok: boolean; detail?: string }> {
  await withTimeout(
    storage.client.send(new HeadBucketCommand({ Bucket: storage.buckets.private })),
    "storage",
  );
  return { ok: true };
}

async function checkMail(): Promise<{ ok: boolean; detail?: string }> {
  const ok = await withTimeout(verifyMailTransport(), "mail");
  return { ok, ...(ok ? {} : { detail: "SMTP verification failed" }) };
}

const REQUIRED: Record<CheckResult["name"], boolean> = {
  database: true,
  redis: true,
  storage: true,
  // Email is required for verification links, but the platform can still serve the catalogue while
  // SMTP is down, so it degrades rather than failing the whole health check.
  mail: false,
};

export async function runHealthChecks(): Promise<{ status: HealthStatus; checks: CheckResult[] }> {
  const runners: Array<[CheckResult["name"], () => Promise<{ ok: boolean; detail?: string }>]> = [
    ["database", checkDatabase],
    ["redis", checkRedis],
    ["storage", checkStorage],
    ["mail", checkMail],
  ];

  const checks: CheckResult[] = [];

  for (const [name, run] of runners) {
    const startedAt = Date.now();
    try {
      const result = await run();
      checks.push({
        name,
        required: REQUIRED[name],
        ok: result.ok,
        durationMs: Date.now() - startedAt,
        ...(result.detail === undefined ? {} : { detail: result.detail }),
      });
    } catch (error) {
      logger.warn({ check: name, err: error }, "health check failed");
      checks.push({
        name,
        required: REQUIRED[name],
        ok: false,
        durationMs: Date.now() - startedAt,
        detail: "unreachable",
      });
    }
  }

  const requiredFailure = checks.some((check) => check.required && !check.ok);
  return { status: requiredFailure ? "degraded" : "ok", checks };
}
