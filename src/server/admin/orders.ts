/**
 * Admin orders (P10-T04). Read-only: refunds and ledger changes go through their own audited flows.
 */

import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";

export const ORDER_PAGE_SIZE = 20;
export const ORDER_STATUSES = [
  "PENDING",
  "PAID",
  "FAILED",
  "CANCELLED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
] as const;
export type OrderStatusValue = (typeof ORDER_STATUSES)[number];

export type AdminOrderFilters = {
  q: string;
  status: OrderStatusValue | "ALL";
  sort: "createdAt" | "totalCents" | "status";
  dir: "asc" | "desc";
  page: number;
};

export type AdminOrderRow = {
  id: string;
  status: OrderStatusValue;
  totalCents: number;
  currency: string;
  createdAt: Date;
  paidAt: Date | null;
  userName: string;
  userEmail: string;
  courses: string[];
  refundStatus: string | null;
};

const SELECT = {
  id: true,
  status: true,
  totalCents: true,
  currency: true,
  createdAt: true,
  paidAt: true,
  user: { select: { name: true, email: true } },
  items: { select: { titleSnapshot: true } },
  refunds: { orderBy: { createdAt: "desc" }, select: { status: true }, take: 1 },
} as const;

type Row = Prisma.OrderGetPayload<{ select: typeof SELECT }>;

function mapRow(row: Row): AdminOrderRow {
  return {
    id: row.id,
    status: row.status,
    totalCents: row.totalCents,
    currency: row.currency,
    createdAt: row.createdAt,
    paidAt: row.paidAt,
    userName: row.user.name,
    userEmail: row.user.email,
    courses: row.items.map((item) => item.titleSnapshot),
    refundStatus: row.refunds[0]?.status ?? null,
  };
}

function buildWhere(filters: AdminOrderFilters): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = {};
  if (filters.status !== "ALL") where.status = filters.status;
  const q = filters.q.trim();
  if (q !== "") {
    where.OR = [
      { id: { contains: q, mode: "insensitive" } },
      { stripeSessionId: { contains: q, mode: "insensitive" } },
      { user: { name: { contains: q, mode: "insensitive" } } },
      { user: { email: { contains: q, mode: "insensitive" } } },
    ];
  }
  return where;
}

export async function listAdminOrders(filters: AdminOrderFilters): Promise<{
  rows: AdminOrderRow[];
  total: number;
  page: number;
  pageCount: number;
}> {
  const where = buildWhere(filters);
  const total = await db.order.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / ORDER_PAGE_SIZE));
  const page = Math.min(Math.max(filters.page, 1), pageCount);
  const rows = await db.order.findMany({
    where,
    orderBy: [{ [filters.sort]: filters.dir }, { id: "asc" }],
    skip: (page - 1) * ORDER_PAGE_SIZE,
    take: ORDER_PAGE_SIZE,
    select: SELECT,
  });
  return { rows: rows.map(mapRow), total, page, pageCount };
}

export async function exportAdminOrders(filters: AdminOrderFilters): Promise<AdminOrderRow[]> {
  const rows = await db.order.findMany({
    where: buildWhere(filters),
    orderBy: [{ [filters.sort]: filters.dir }, { id: "asc" }],
    take: 10_000,
    select: SELECT,
  });
  return rows.map(mapRow);
}

export function parseAdminOrderFilters(raw: Record<string, string>): AdminOrderFilters {
  const status = raw.status as OrderStatusValue | undefined;
  const sort = raw.sort as AdminOrderFilters["sort"] | undefined;
  return {
    q: typeof raw.q === "string" ? raw.q.slice(0, 200) : "",
    status: status !== undefined && ORDER_STATUSES.includes(status) ? status : "ALL",
    sort: sort === "totalCents" || sort === "status" || sort === "createdAt" ? sort : "createdAt",
    dir: raw.dir === "asc" ? "asc" : "desc",
    page: Math.max(1, Number(raw.page ?? "1") || 1),
  };
}
