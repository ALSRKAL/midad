/**
 * Admin users list (P05-T01 table, P05-T03 actions).
 *
 * Server-side search, role/status filters, sorting and pagination. Emails are visible to admins by
 * design; the support-facing table is the only place they are shown unmasked.
 */

import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";

export const ADMIN_PAGE_SIZE = 20;

export type AdminUserRole = "STUDENT" | "INSTRUCTOR" | "ADMIN";
export type AdminUserStatus = "ACTIVE" | "BANNED" | "DELETED";

export type AdminUserFilters = {
  q: string;
  role?: AdminUserRole;
  status?: AdminUserStatus;
  sort: "createdAt" | "name" | "email" | "role";
  dir: "asc" | "desc";
  page: number;
};

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  username: string | null;
  role: AdminUserRole;
  status: AdminUserStatus;
  emailVerified: boolean;
  createdAt: Date;
  enrollmentCount: number;
};

function buildWhere(filters: AdminUserFilters): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {};
  const q = filters.q.trim();
  if (q !== "") {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { username: { contains: q, mode: "insensitive" } },
    ];
  }
  if (filters.role !== undefined) where.role = filters.role;
  if (filters.status !== undefined) where.status = filters.status;
  return where;
}

export async function listAdminUsers(filters: AdminUserFilters): Promise<{
  rows: AdminUserRow[];
  total: number;
  page: number;
  pageCount: number;
}> {
  const where = buildWhere(filters);
  const total = await db.user.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  const page = Math.min(Math.max(filters.page, 1), pageCount);

  const rows = await db.user.findMany({
    where,
    orderBy: [{ [filters.sort]: filters.dir }, { id: "asc" }],
    skip: (page - 1) * ADMIN_PAGE_SIZE,
    take: ADMIN_PAGE_SIZE,
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      role: true,
      status: true,
      emailVerified: true,
      createdAt: true,
      _count: { select: { enrollments: true } },
    },
  });

  return {
    rows: rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      username: row.username,
      role: row.role,
      status: row.status,
      emailVerified: row.emailVerified,
      createdAt: row.createdAt,
      enrollmentCount: row._count.enrollments,
    })),
    total,
    page,
    pageCount,
  };
}

/** Full export with the same filters; capped so a request cannot stream an unbounded table. */
export async function exportAdminUsers(filters: AdminUserFilters): Promise<AdminUserRow[]> {
  const rows = await db.user.findMany({
    where: buildWhere(filters),
    orderBy: [{ [filters.sort]: filters.dir }, { id: "asc" }],
    take: 10_000,
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      role: true,
      status: true,
      emailVerified: true,
      createdAt: true,
      _count: { select: { enrollments: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    username: row.username,
    role: row.role,
    status: row.status,
    emailVerified: row.emailVerified,
    createdAt: row.createdAt,
    enrollmentCount: row._count.enrollments,
  }));
}

export function parseAdminUserFilters(
  raw: Record<string, string | string[] | undefined>,
): AdminUserFilters {
  const scalar = (key: string): string | undefined => {
    const value = raw[key];
    return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
  };

  const roleValue = scalar("role");
  const role =
    roleValue === "STUDENT" || roleValue === "INSTRUCTOR" || roleValue === "ADMIN"
      ? roleValue
      : undefined;
  const statusValue = scalar("status");
  const status =
    statusValue === "ACTIVE" || statusValue === "BANNED" || statusValue === "DELETED"
      ? statusValue
      : undefined;
  const sortValue = scalar("sort");
  const sort =
    sortValue === "name" || sortValue === "email" || sortValue === "role" ? sortValue : "createdAt";
  const dir = scalar("dir") === "asc" ? "asc" : "desc";
  const pageRaw = Number(scalar("page") ?? "1");
  const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  return {
    q: scalar("q") ?? "",
    ...(role === undefined ? {} : { role }),
    ...(status === undefined ? {} : { status }),
    sort,
    dir,
    page,
  };
}
