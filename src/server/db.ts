/**
 * Prisma client singleton.
 *
 * Prisma 7 talks to PostgreSQL through a driver adapter (@prisma/adapter-pg), so the connection
 * string is passed here rather than read from the schema. The instance is cached on `globalThis`
 * because Next's dev server re-evaluates modules on every hot reload and a new pool per reload
 * exhausts Postgres connections within minutes.
 */

import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { env } from "@/env";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
  return new PrismaClient({
    adapter,
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const db: PrismaClient = globalForPrisma.prisma ?? createClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;
