import { describe, expect, it } from "vitest";

import { clientSchema, parseClientEnv, parseServerEnv, serverSchema } from "@/env-schema";
import { createStorage, storageConfigFromEnv } from "@/server/storage-core";

const baseEnv = {
  DATABASE_URL: "postgresql://midad:midad@localhost:5433/midad",
  REDIS_URL: "redis://localhost:6380",
  S3_ENDPOINT: "http://localhost:9000",
  S3_ACCESS_KEY_ID: "key",
  S3_SECRET_ACCESS_KEY: "secret",
  S3_BUCKET_PUBLIC: "midad-public",
  S3_BUCKET_PRIVATE: "midad-media",
  AUTH_SECRET: "a".repeat(40),
} as const;

describe("environment contract", () => {
  it("accepts a minimal valid server environment and applies defaults", () => {
    const env = parseServerEnv({ ...baseEnv, NODE_ENV: "development" });
    expect(env.S3_REGION).toBe("us-east-1");
    expect(env.S3_FORCE_PATH_STYLE).toBe(true);
    expect(env.VAT_BPS).toBe(1500);
    expect(env.PLATFORM_COMMISSION_BPS).toBe(7000);
  });

  it("treats empty strings as absent optional values", () => {
    const env = parseServerEnv({ ...baseEnv, STRIPE_SECRET_KEY: "", GOOGLE_CLIENT_ID: "  " });
    expect(env.STRIPE_SECRET_KEY).toBeUndefined();
    expect(env.GOOGLE_CLIENT_ID).toBeUndefined();
  });

  it("rejects a non-Postgres database url", () => {
    expect(() => parseServerEnv({ ...baseEnv, DATABASE_URL: "mysql://x" })).toThrow(/postgres/);
  });

  it("rejects a short auth secret", () => {
    expect(() => parseServerEnv({ ...baseEnv, AUTH_SECRET: "short" })).toThrow(/32 characters/);
  });

  it("lists every missing variable in the error, not just the first", () => {
    try {
      parseServerEnv({});
      expect.unreachable("should have thrown");
    } catch (error) {
      const message = (error as Error).message;
      expect(message).toContain("DATABASE_URL");
      expect(message).toContain("AUTH_SECRET");
      expect(message).toContain("S3_BUCKET_PRIVATE");
    }
  });

  it("validates the public environment separately", () => {
    const client = parseClientEnv({ NEXT_PUBLIC_SITE_URL: "https://midad.example" });
    expect(client.NEXT_PUBLIC_DEFAULT_LOCALE).toBe("ar");
    expect(client.NEXT_PUBLIC_DEFAULT_CURRENCY).toBe("SAR");
  });

  it("rejects a Stripe secret placed in a public variable", () => {
    const result = clientSchema.safeParse({
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      NEXT_PUBLIC_DEFAULT_LOCALE: "ar",
      NEXT_PUBLIC_DEFAULT_CURRENCY: "SAR",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "sk_test_should_not_be_here",
    });
    expect(result.success).toBe(false);
  });

  it("exposes the same schema to tooling that runs outside Next", () => {
    expect(serverSchema.safeParse(baseEnv).success).toBe(true);
  });
});

describe("storage configuration", () => {
  const env = parseServerEnv(baseEnv);

  it("maps the two buckets and their roles", () => {
    const config = storageConfigFromEnv(env);
    expect(config.buckets.public).toBe("midad-public");
    expect(config.buckets.private).toBe("midad-media");
    expect(config.forcePathStyle).toBe(true);
  });

  it("builds public URLs under the public bucket only", () => {
    const storage = createStorage(storageConfigFromEnv(env));
    expect(storage.publicUrl("seed/covers/a.png")).toBe(
      "http://localhost:9000/midad-public/seed/covers/a.png",
    );
    expect(storage.publicUrl("/seed/covers/a.png")).toBe(
      "http://localhost:9000/midad-public/seed/covers/a.png",
    );
  });

  it("does not double a trailing slash in the endpoint", () => {
    const storage = createStorage(
      storageConfigFromEnv({ ...env, S3_ENDPOINT: "http://localhost:9000/" }),
    );
    expect(storage.publicUrl("a.png")).toBe("http://localhost:9000/midad-public/a.png");
  });
});
