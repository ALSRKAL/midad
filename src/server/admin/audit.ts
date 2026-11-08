/**
 * Audit log reader (P05-T04).
 *
 * The table is append-only by contract; this module never writes. Search covers the actor, action,
 * entity and id, with an entity filter and an action substring.
 */

import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";

export const AUDIT_PAGE_SIZE = 20;

export type AdminAuditRow = {
  id: string;
  createdAt: Date;
  actorName: string | null;
  actorEmail: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  ip: string | null;
};

export type AdminAuditFilters = {
  q: string;
  entity?: string;
  action?: string;
  sort: "createdAt" | "action" | "entity";
  dir: "asc" | "desc";
  page: number;
};

const SELECT = {
  id: true,
  createdAt: true,
  action: true,
  entity: true,
  entityId: true,
  ip: true,
  actor: { select: { name: true, email: true } },
} as const;

type Row = Prisma.AuditLogGetPayload<{ select: typeof SELECT }>;

function mapRow(row: Row): AdminAuditRow {
  return {
    id: row.id,
    createdAt: row.createdAt,
    actorName: row.actor?.name ?? null,
    actorEmail: row.actor?.email ?? null,
    action: row.action,
    entity: row.entity,
    entityId: row.entityId,
    ip: row.ip,
  };
}

function buildWhere(filters: AdminAuditFilters): Prisma.AuditLogWhereInput {
  const where: Prisma.AuditLogWhereInput = {};
  if (filters.entity !== undefined) where.entity = filters.entity;
  if (filters.action !== undefined)
    where.action = { contains: filters.action, mode: "insensitive" };
  const q = filters.q.trim();
  if (q !== "") {
    where.OR = [
      { action: { contains: q, mode: "insensitive" } },
      { entity: { contains: q, mode: "insensitive" } },
      { entityId: { contains: q, mode: "insensitive" } },
      { actor: { name: { contains: q, mode: "insensitive" } } },
      { actor: { email: { contains: q, mode: "insensitive" } } },
    ];
  }
  return where;
}

export async function listAdminAudit(filters: AdminAuditFilters): Promise<{
  rows: AdminAuditRow[];
  total: number;
  page: number;
  pageCount: number;
}> {
  const where = buildWhere(filters);
  const total = await db.auditLog.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / AUDIT_PAGE_SIZE));
  const page = Math.min(Math.max(filters.page, 1), pageCount);

  const rows = await db.auditLog.findMany({
    where,
    orderBy: [{ [filters.sort]: filters.dir }, { id: "asc" }],
    skip: (page - 1) * AUDIT_PAGE_SIZE,
    take: AUDIT_PAGE_SIZE,
    select: SELECT,
  });

  return { rows: rows.map(mapRow), total, page, pageCount };
}

export async function exportAdminAudit(filters: AdminAuditFilters): Promise<AdminAuditRow[]> {
  const rows = await db.auditLog.findMany({
    where: buildWhere(filters),
    orderBy: [{ [filters.sort]: filters.dir }, { id: "asc" }],
    take: 10_000,
    select: SELECT,
  });
  return rows.map(mapRow);
}

export function parseAdminAuditFilters(
  raw: Record<string, string | string[] | undefined>,
): AdminAuditFilters {
  const scalar = (key: string): string | undefined => {
    const value = raw[key];
    return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
  };

  const sortRaw = scalar("sort");
  const sort = sortRaw === "action" || sortRaw === "entity" ? sortRaw : "createdAt";
  const dir = scalar("dir") === "asc" ? "asc" : "desc";
  const pageRaw = Number(scalar("page") ?? "1");
  const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  const entity = scalar("entity");
  const action = scalar("action");

  return {
    q: scalar("q") ?? "",
    ...(entity === undefined ? {} : { entity }),
    ...(action === undefined ? {} : { action }),
    sort,
    dir,
    page,
  };
}

export async function listAuditEntities(): Promise<string[]> {
  const rows = await db.auditLog.findMany({
    distinct: ["entity"],
    select: { entity: true },
    orderBy: { entity: "asc" },
  });
  return rows.map((row) => row.entity);
}
