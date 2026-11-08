/**
 * Admin refund queue and execution (P10-T03, BR-10).
 *
 * Approval is the only place money moves back: a Stripe refund is executed once with an idempotency
 * key, then a single transaction marks the order/payment refunded, revokes the enrolments, appends
 * the negative ledger entries and records the audit event. Rejection only records the decision.
 */

import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { conflict, notFound } from "@/lib/errors";
import { db } from "@/server/db";
import { createNotification } from "@/server/notifications";
import { getStripe } from "@/server/stripe";

export const REFUND_PAGE_SIZE = 20;
export const REFUND_STATUSES = ["REQUESTED", "APPROVED", "REJECTED", "COMPLETED"] as const;
export type RefundStatusValue = (typeof REFUND_STATUSES)[number];

export type AdminRefundFilters = {
  q: string;
  status: RefundStatusValue | "ALL";
  sort: "createdAt" | "amountCents" | "status";
  dir: "asc" | "desc";
  page: number;
};

export type AdminRefundRow = {
  id: string;
  status: RefundStatusValue;
  amountCents: number;
  currency: string;
  reason: string;
  decisionNote: string | null;
  createdAt: Date;
  decidedAt: Date | null;
  orderId: string;
  orderTotalCents: number;
  learnerName: string;
  learnerEmail: string;
  courses: string[];
};

const SELECT = {
  id: true,
  status: true,
  amountCents: true,
  reason: true,
  decisionNote: true,
  createdAt: true,
  decidedAt: true,
  order: {
    select: {
      id: true,
      totalCents: true,
      currency: true,
      user: { select: { name: true, email: true } },
      items: { select: { titleSnapshot: true } },
    },
  },
} as const;

type Row = Prisma.RefundGetPayload<{ select: typeof SELECT }>;

function mapRow(row: Row): AdminRefundRow {
  return {
    id: row.id,
    status: row.status,
    amountCents: row.amountCents,
    currency: row.order.currency,
    reason: row.reason,
    decisionNote: row.decisionNote,
    createdAt: row.createdAt,
    decidedAt: row.decidedAt,
    orderId: row.order.id,
    orderTotalCents: row.order.totalCents,
    learnerName: row.order.user.name,
    learnerEmail: row.order.user.email,
    courses: row.order.items.map((item) => item.titleSnapshot),
  };
}

function buildWhere(filters: AdminRefundFilters): Prisma.RefundWhereInput {
  const where: Prisma.RefundWhereInput = {};
  if (filters.status !== "ALL") where.status = filters.status;
  const q = filters.q.trim();
  if (q !== "") {
    where.OR = [
      { id: { contains: q, mode: "insensitive" } },
      { orderId: { contains: q, mode: "insensitive" } },
      { order: { user: { name: { contains: q, mode: "insensitive" } } } },
      { order: { user: { email: { contains: q, mode: "insensitive" } } } },
    ];
  }
  return where;
}

export async function listAdminRefunds(filters: AdminRefundFilters): Promise<{
  rows: AdminRefundRow[];
  total: number;
  page: number;
  pageCount: number;
}> {
  const where = buildWhere(filters);
  const total = await db.refund.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / REFUND_PAGE_SIZE));
  const page = Math.min(Math.max(filters.page, 1), pageCount);

  const rows = await db.refund.findMany({
    where,
    orderBy: [{ [filters.sort]: filters.dir }, { id: "asc" }],
    skip: (page - 1) * REFUND_PAGE_SIZE,
    take: REFUND_PAGE_SIZE,
    select: SELECT,
  });

  return { rows: rows.map(mapRow), total, page, pageCount };
}

export async function exportAdminRefunds(filters: AdminRefundFilters): Promise<AdminRefundRow[]> {
  const rows = await db.refund.findMany({
    where: buildWhere(filters),
    orderBy: [{ [filters.sort]: filters.dir }, { id: "asc" }],
    take: 10_000,
    select: SELECT,
  });
  return rows.map(mapRow);
}

export type AdminRefundDetail = AdminRefundRow & {
  stripeRefundId: string | null;
  requestedByName: string;
  decidedByName: string | null;
  orderPaidAt: Date | null;
  paymentStatus: "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED" | null;
};

export async function getAdminRefund(id: string): Promise<AdminRefundDetail | null> {
  const refund = await db.refund.findUnique({
    where: { id },
    select: {
      ...SELECT,
      stripeRefundId: true,
      requestedBy: { select: { name: true } },
      decidedBy: { select: { name: true } },
      order: {
        select: {
          ...SELECT.order.select,
          paidAt: true,
          payment: { select: { status: true } },
        },
      },
    },
  });
  if (refund === null) return null;
  return {
    ...mapRow(refund),
    stripeRefundId: refund.stripeRefundId,
    requestedByName: refund.requestedBy.name,
    decidedByName: refund.decidedBy?.name ?? null,
    orderPaidAt: refund.order.paidAt,
    paymentStatus: refund.order.payment?.status ?? null,
  };
}

export function parseAdminRefundFilters(raw: Record<string, string>): AdminRefundFilters {
  const status = raw.status as RefundStatusValue | undefined;
  const sort = raw.sort as AdminRefundFilters["sort"] | undefined;
  return {
    q: typeof raw.q === "string" ? raw.q.slice(0, 200) : "",
    status: status !== undefined && REFUND_STATUSES.includes(status) ? status : "ALL",
    sort: sort === "amountCents" || sort === "status" || sort === "createdAt" ? sort : "createdAt",
    dir: raw.dir === "asc" ? "asc" : "desc",
    page: Math.max(1, Number(raw.page ?? "1") || 1),
  };
}

type DecidableRefund = Prisma.RefundGetPayload<{
  select: {
    id: true;
    status: true;
    amountCents: true;
    orderId: true;
    requestedById: true;
    order: {
      select: {
        id: true;
        currency: true;
        payment: { select: { id: true; stripePaymentIntentId: true } };
        items: { select: { instructorProfileId: true; instructorShareCents: true } };
      };
    };
  };
}>;

const DECISION_SELECT = {
  id: true,
  status: true,
  amountCents: true,
  orderId: true,
  requestedById: true,
  order: {
    select: {
      id: true,
      currency: true,
      payment: { select: { id: true, stripePaymentIntentId: true } },
      items: { select: { instructorProfileId: true, instructorShareCents: true } },
    },
  },
} as const;

async function loadDecidable(refundId: string): Promise<DecidableRefund> {
  const refund = await db.refund.findUnique({
    where: { id: refundId },
    select: DECISION_SELECT,
  });
  if (refund === null) throw notFound("Refund not found");
  return refund;
}

export async function approveRefund(input: {
  adminId: string;
  refundId: string;
  note: string;
  /** Test seam; production uses the Stripe SDK below. */
  execute?: (input: {
    paymentIntent: string;
    amountCents: number;
    refundId: string;
    orderId: string;
  }) => Promise<{ id: string; status: string }>;
}): Promise<void> {
  const refund = await loadDecidable(input.refundId);
  if (refund.status !== "REQUESTED") throw conflict("REFUND_ALREADY_DECIDED");
  const paymentIntent = refund.order.payment?.stripePaymentIntentId;
  if (paymentIntent === null || paymentIntent === undefined || paymentIntent === "") {
    throw conflict("PAYMENT_INTENT_MISSING");
  }

  const execute =
    input.execute ??
    (async ({ paymentIntent: intent, amountCents, refundId, orderId }) =>
      getStripe().refunds.create(
        {
          payment_intent: intent,
          amount: amountCents,
          reason: "requested_by_customer",
          metadata: { refundId, orderId },
        },
        { idempotencyKey: `midad-refund-${refundId}` },
      ));
  const stripeRefund = await execute({
    paymentIntent,
    amountCents: refund.amountCents,
    refundId: refund.id,
    orderId: refund.orderId,
  });
  if (stripeRefund.status !== "succeeded") throw conflict("REFUND_NOT_SUCCEEDED");

  const note = input.note.trim();
  await db.$transaction(async (tx) => {
    const updated = await tx.refund.updateMany({
      where: { id: refund.id, status: "REQUESTED" },
      data: {
        status: "COMPLETED",
        decidedById: input.adminId,
        decidedAt: new Date(),
        decisionNote: note === "" ? null : note.slice(0, 2000),
        stripeRefundId: stripeRefund.id,
      },
    });
    if (updated.count === 0) throw conflict("REFUND_ALREADY_DECIDED");

    await tx.order.update({
      where: { id: refund.orderId },
      data: { status: "REFUNDED" },
    });
    if (refund.order.payment !== null) {
      await tx.payment.update({
        where: { id: refund.order.payment.id },
        data: { status: "REFUNDED" },
      });
    }
    await tx.enrollment.updateMany({
      where: { orderId: refund.orderId },
      data: { status: "REVOKED", revokedAt: new Date() },
    });
    for (const item of refund.order.items) {
      await tx.ledgerEntry.create({
        data: {
          instructorProfileId: item.instructorProfileId,
          type: "REFUND",
          amountCents: -item.instructorShareCents,
          currency: refund.order.currency,
          orderId: refund.orderId,
          refundId: refund.id,
          description: "Refund reversal",
        },
      });
    }
    await tx.auditLog.create({
      data: {
        actorId: input.adminId,
        action: "refund.approved",
        entity: "Refund",
        entityId: refund.id,
        before: { status: "REQUESTED" },
        after: { status: "COMPLETED", stripeRefundId: stripeRefund.id, note },
      },
    });
  });

  await createNotification({
    userId: refund.requestedById,
    type: "REFUND_DECISION",
    title: { ar: "تم تنفيذ الاسترداد", en: "Your refund was completed" },
    body: {
      ar: "أُعيد المبلغ إلى وسيلة الدفع الأصلية وأُلغي الوصول إلى الدورات.",
      en: "The amount was returned to the original payment method and course access was revoked.",
    },
    linkPath: "/purchases",
  });
}

export async function rejectRefund(input: {
  adminId: string;
  refundId: string;
  note: string;
}): Promise<void> {
  const note = input.note.trim();
  if (note.length < 5) throw conflict("REASON_TOO_SHORT");
  const refund = await loadDecidable(input.refundId);
  if (refund.status !== "REQUESTED") throw conflict("REFUND_ALREADY_DECIDED");

  await db.$transaction([
    db.refund.update({
      where: { id: refund.id },
      data: {
        status: "REJECTED",
        decidedById: input.adminId,
        decidedAt: new Date(),
        decisionNote: note.slice(0, 2000),
      },
    }),
    db.auditLog.create({
      data: {
        actorId: input.adminId,
        action: "refund.rejected",
        entity: "Refund",
        entityId: refund.id,
        before: { status: "REQUESTED" },
        after: { status: "REJECTED", note },
      },
    }),
  ]);

  await createNotification({
    userId: refund.requestedById,
    type: "REFUND_DECISION",
    title: { ar: "لم يُقبل طلب الاسترداد", en: "Your refund request was declined" },
    body: { ar: note, en: note },
    linkPath: "/purchases",
  });
}
