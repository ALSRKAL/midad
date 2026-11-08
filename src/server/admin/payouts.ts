/**
 * Admin payout queue (P10-T04, BR-13).
 *
 * Marking a payout paid is the moment money leaves: a negative PAYOUT entry is appended to the
 * ledger, so the instructor's available balance drops without ever editing a stored number. Rejection
 * releases the reserved amount by changing the request status only.
 */

import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { conflict, notFound } from "@/lib/errors";
import { db } from "@/server/db";
import { createNotification } from "@/server/notifications";

export const PAYOUT_PAGE_SIZE = 20;
export const PAYOUT_STATUSES = ["REQUESTED", "APPROVED", "PAID", "REJECTED"] as const;
export type PayoutStatusValue = (typeof PAYOUT_STATUSES)[number];

export type AdminPayoutFilters = {
  q: string;
  status: PayoutStatusValue | "ALL";
  sort: "createdAt" | "amountCents" | "status";
  dir: "asc" | "desc";
  page: number;
};

export type AdminPayoutRow = {
  id: string;
  amountCents: number;
  currency: string;
  status: PayoutStatusValue;
  transferReference: string | null;
  createdAt: Date;
  decidedAt: Date | null;
  paidAt: Date | null;
  instructorName: string;
  instructorEmail: string;
};

const SELECT = {
  id: true,
  amountCents: true,
  currency: true,
  status: true,
  transferReference: true,
  createdAt: true,
  decidedAt: true,
  paidAt: true,
  instructorProfile: { select: { user: { select: { name: true, email: true } } } },
} as const;

type Row = Prisma.PayoutGetPayload<{ select: typeof SELECT }>;

function mapRow(row: Row): AdminPayoutRow {
  return {
    id: row.id,
    amountCents: row.amountCents,
    currency: row.currency,
    status: row.status,
    transferReference: row.transferReference,
    createdAt: row.createdAt,
    decidedAt: row.decidedAt,
    paidAt: row.paidAt,
    instructorName: row.instructorProfile.user.name,
    instructorEmail: row.instructorProfile.user.email,
  };
}

function buildWhere(filters: AdminPayoutFilters): Prisma.PayoutWhereInput {
  const where: Prisma.PayoutWhereInput = {};
  if (filters.status !== "ALL") where.status = filters.status;
  const q = filters.q.trim();
  if (q !== "") {
    where.OR = [
      { id: { contains: q, mode: "insensitive" } },
      { transferReference: { contains: q, mode: "insensitive" } },
      { instructorProfile: { user: { name: { contains: q, mode: "insensitive" } } } },
      { instructorProfile: { user: { email: { contains: q, mode: "insensitive" } } } },
    ];
  }
  return where;
}

export async function listAdminPayouts(filters: AdminPayoutFilters): Promise<{
  rows: AdminPayoutRow[];
  total: number;
  page: number;
  pageCount: number;
}> {
  const where = buildWhere(filters);
  const total = await db.payout.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / PAYOUT_PAGE_SIZE));
  const page = Math.min(Math.max(filters.page, 1), pageCount);

  const rows = await db.payout.findMany({
    where,
    orderBy: [{ [filters.sort]: filters.dir }, { id: "asc" }],
    skip: (page - 1) * PAYOUT_PAGE_SIZE,
    take: PAYOUT_PAGE_SIZE,
    select: SELECT,
  });

  return { rows: rows.map(mapRow), total, page, pageCount };
}

export async function exportAdminPayouts(filters: AdminPayoutFilters): Promise<AdminPayoutRow[]> {
  const rows = await db.payout.findMany({
    where: buildWhere(filters),
    orderBy: [{ [filters.sort]: filters.dir }, { id: "asc" }],
    take: 10_000,
    select: SELECT,
  });
  return rows.map(mapRow);
}

export function parseAdminPayoutFilters(raw: Record<string, string>): AdminPayoutFilters {
  const status = raw.status as PayoutStatusValue | undefined;
  const sort = raw.sort as AdminPayoutFilters["sort"] | undefined;
  return {
    q: typeof raw.q === "string" ? raw.q.slice(0, 200) : "",
    status: status !== undefined && PAYOUT_STATUSES.includes(status) ? status : "ALL",
    sort: sort === "amountCents" || sort === "status" || sort === "createdAt" ? sort : "createdAt",
    dir: raw.dir === "asc" ? "asc" : "desc",
    page: Math.max(1, Number(raw.page ?? "1") || 1),
  };
}

export type AdminPayoutDetail = AdminPayoutRow & {
  decidedByName: string | null;
  instructorId: string;
  ledger: Array<{ id: string; amountCents: number; type: string; createdAt: Date }>;
};

export async function getAdminPayout(id: string): Promise<AdminPayoutDetail | null> {
  const payout = await db.payout.findUnique({
    where: { id },
    select: {
      ...SELECT,
      instructorProfileId: true,
      decidedBy: { select: { name: true } },
      instructorProfile: {
        select: { user: { select: { id: true, name: true, email: true } } },
      },
      ledgerEntries: {
        orderBy: { createdAt: "desc" },
        select: { id: true, amountCents: true, type: true, createdAt: true },
      },
    },
  });
  if (payout === null) return null;
  return {
    ...mapRow(payout),
    decidedByName: payout.decidedBy?.name ?? null,
    instructorId: payout.instructorProfile.user.id,
    ledger: payout.ledgerEntries,
  };
}

async function loadPayout(id: string) {
  const payout = await db.payout.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      amountCents: true,
      currency: true,
      instructorProfileId: true,
      instructorProfile: { select: { userId: true } },
    },
  });
  if (payout === null) throw notFound("Payout not found");
  return payout;
}

export async function approvePayout(input: { adminId: string; payoutId: string }): Promise<void> {
  const payout = await loadPayout(input.payoutId);
  if (payout.status !== "REQUESTED") throw conflict("PAYOUT_ALREADY_DECIDED");
  await db.$transaction([
    db.payout.update({
      where: { id: payout.id },
      data: { status: "APPROVED", decidedById: input.adminId, decidedAt: new Date() },
    }),
    db.auditLog.create({
      data: {
        actorId: input.adminId,
        action: "payout.approved",
        entity: "Payout",
        entityId: payout.id,
        before: { status: "REQUESTED" },
        after: { status: "APPROVED" },
      },
    }),
  ]);
}

export async function markPayoutPaid(input: {
  adminId: string;
  payoutId: string;
  transferReference: string;
}): Promise<void> {
  const payout = await loadPayout(input.payoutId);
  if (payout.status !== "REQUESTED" && payout.status !== "APPROVED") {
    throw conflict("PAYOUT_ALREADY_DECIDED");
  }
  const reference = input.transferReference.trim();
  if (reference.length < 3) throw conflict("TRANSFER_REFERENCE_REQUIRED");

  await db.$transaction(async (tx) => {
    const updated = await tx.payout.updateMany({
      where: { id: payout.id, status: { in: ["REQUESTED", "APPROVED"] } },
      data: {
        status: "PAID",
        paidAt: new Date(),
        decidedById: input.adminId,
        decidedAt: new Date(),
        transferReference: reference.slice(0, 200),
      },
    });
    if (updated.count === 0) throw conflict("PAYOUT_ALREADY_DECIDED");

    await tx.ledgerEntry.create({
      data: {
        instructorProfileId: payout.instructorProfileId,
        type: "PAYOUT",
        amountCents: -payout.amountCents,
        currency: payout.currency,
        payoutId: payout.id,
        description: "Payout transfer",
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: input.adminId,
        action: "payout.paid",
        entity: "Payout",
        entityId: payout.id,
        before: { status: payout.status },
        after: { status: "PAID", transferReference: reference },
      },
    });
  });

  await createNotification({
    userId: payout.instructorProfile.userId,
    type: "PAYOUT_DECISION",
    title: { ar: "تم تحويل أرباحك", en: "Your payout was sent" },
    body: {
      ar: `حُوّل مبلغ ${(payout.amountCents / 100).toFixed(2)} ريال. مرجع التحويل: ${reference}`,
      en: `A payout of ${(payout.amountCents / 100).toFixed(2)} SAR was sent. Reference: ${reference}`,
    },
    linkPath: "/instructor/earnings",
  });
}

export async function rejectPayout(input: {
  adminId: string;
  payoutId: string;
  note: string;
}): Promise<void> {
  const notice = input.note.trim();
  if (notice.length < 5) throw conflict("REASON_TOO_SHORT");
  const payout = await loadPayout(input.payoutId);
  if (payout.status !== "REQUESTED" && payout.status !== "APPROVED") {
    throw conflict("PAYOUT_ALREADY_DECIDED");
  }

  await db.$transaction(async (tx) => {
    const updated = await tx.payout.updateMany({
      where: { id: payout.id, status: { in: ["REQUESTED", "APPROVED"] } },
      data: {
        status: "REJECTED",
        decidedById: input.adminId,
        decidedAt: new Date(),
      },
    });
    if (updated.count === 0) throw conflict("PAYOUT_ALREADY_DECIDED");
    await tx.auditLog.create({
      data: {
        actorId: input.adminId,
        action: "payout.rejected",
        entity: "Payout",
        entityId: payout.id,
        before: { status: payout.status },
        after: { status: "REJECTED", note: notice },
      },
    });
  });

  await createNotification({
    userId: payout.instructorProfile.userId,
    type: "PAYOUT_DECISION",
    title: { ar: "رُفض طلب السحب", en: "Your payout request was declined" },
    body: { ar: notice, en: notice },
    linkPath: "/instructor/earnings",
  });
}
