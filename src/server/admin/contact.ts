/** Contact messages inbox (P10-T04). Admin status changes are audited and never delete messages. */

import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { notFound } from "@/lib/errors";
import { db } from "@/server/db";

export const CONTACT_PAGE_SIZE = 20;
export const CONTACT_STATUSES = ["NEW", "READ", "ARCHIVED"] as const;
export type ContactStatusValue = (typeof CONTACT_STATUSES)[number];

export type AdminContactFilters = {
  q: string;
  status: ContactStatusValue | "ALL";
  sort: "createdAt" | "status";
  dir: "asc" | "desc";
  page: number;
};

export type AdminContactRow = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: ContactStatusValue;
  createdAt: Date;
};

const SELECT = {
  id: true,
  name: true,
  email: true,
  subject: true,
  message: true,
  status: true,
  createdAt: true,
} as const;

function buildWhere(filters: AdminContactFilters): Prisma.ContactMessageWhereInput {
  const where: Prisma.ContactMessageWhereInput = {};
  if (filters.status !== "ALL") where.status = filters.status;
  const q = filters.q.trim();
  if (q !== "") {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { subject: { contains: q, mode: "insensitive" } },
      { message: { contains: q, mode: "insensitive" } },
    ];
  }
  return where;
}

export async function listAdminContactMessages(filters: AdminContactFilters): Promise<{
  rows: AdminContactRow[];
  total: number;
  page: number;
  pageCount: number;
}> {
  const where = buildWhere(filters);
  const total = await db.contactMessage.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / CONTACT_PAGE_SIZE));
  const page = Math.min(Math.max(filters.page, 1), pageCount);
  const rows = await db.contactMessage.findMany({
    where,
    orderBy: [{ [filters.sort]: filters.dir }, { id: "asc" }],
    skip: (page - 1) * CONTACT_PAGE_SIZE,
    take: CONTACT_PAGE_SIZE,
    select: SELECT,
  });
  return { rows, total, page, pageCount };
}

export async function exportAdminContactMessages(
  filters: AdminContactFilters,
): Promise<AdminContactRow[]> {
  return db.contactMessage.findMany({
    where: buildWhere(filters),
    orderBy: [{ [filters.sort]: filters.dir }, { id: "asc" }],
    take: 10_000,
    select: SELECT,
  });
}

export function parseAdminContactFilters(raw: Record<string, string>): AdminContactFilters {
  const status = raw.status as ContactStatusValue | undefined;
  return {
    q: typeof raw.q === "string" ? raw.q.slice(0, 200) : "",
    status: status !== undefined && CONTACT_STATUSES.includes(status) ? status : "ALL",
    sort: raw.sort === "status" ? "status" : "createdAt",
    dir: raw.dir === "asc" ? "asc" : "desc",
    page: Math.max(1, Number(raw.page ?? "1") || 1),
  };
}

export async function setContactStatus(input: {
  adminId: string;
  messageId: string;
  status: "READ" | "ARCHIVED";
}): Promise<void> {
  const message = await db.contactMessage.findUnique({
    where: { id: input.messageId },
    select: { id: true, status: true },
  });
  if (message === null) throw notFound("Message not found");

  await db.$transaction([
    db.contactMessage.update({ where: { id: message.id }, data: { status: input.status } }),
    db.auditLog.create({
      data: {
        actorId: input.adminId,
        action: "contact.status",
        entity: "ContactMessage",
        entityId: message.id,
        before: { status: message.status },
        after: { status: input.status },
      },
    }),
  ]);
}
