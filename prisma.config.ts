import { config } from "dotenv";
import { defineConfig } from "prisma/config";

/**
 * Prisma 7 configuration.
 *
 * Next.js loads `.env.local`, but the Prisma CLI has its own loader, so the precedence here
 * mirrors the app: `.env.local` first, then `.env`, then the ambient process environment.
 * Secrets are never printed by this file.
 */
config({ path: ".env.local" });
config();

const databaseUrl = process.env["DATABASE_URL"];

if (databaseUrl === undefined || databaseUrl.trim() === "") {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env.local (see src/env.ts and README § Quick start).",
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
