import "server-only";

import { conflict, notFound, validationFailed } from "@/lib/errors";
import { refundEligibility } from "@/lib/refund-rules";
import { db } from "@/server/db";
import { getPlatformSettings } from "@/server/platform-settings";
import type { SessionUser } from "@/server/session";

/**
 * Refund requests (P10-T03, BR-10).
 *
 * Eligibility is evaluated from the order, its enrolments and issued certificates on every request.
 * The request itself moves no money; only the admin decision executes Stripe and reverses the ledger.
 */

export async function requestRefund(input: {
  user: SessionUser;
  orderId: string;
  reason: string;
}): Promise<{ id: string }> {
  const reason = input.reason.trim();
  if (reason.length < 10) throw validationFailed({ reason: ["REASON_TOO_SHORT"] });
  if (reason.length > 2000) throw validationFailed({ reason: ["REASON_TOO_LONG"] });

  const order = await db.order.findFirst({
    where: { id: input.orderId, userId: input.user.id },
    select: {
      id: true,
      status: true,
      paidAt: true,
      totalCents: true,
      items: { select: { courseId: true } },
      refunds: {
        orderBy: { createdAt: "desc" },
        select: { status: true },
        take: 1,
      },
    },
  });
  if (order === null) throw notFound("Order not found");

  const [enrollments, settings] = await Promise.all([
    db.enrollment.findMany({
      where: { userId: input.user.id, orderId: order.id },
      select: {
        courseId: true,
        progressPct: true,
        certificate: { select: { status: true } },
      },
    }),
    getPlatformSettings(),
  ]);

  const eligibility = refundEligibility({
    status: order.status,
    paidAt: order.paidAt,
    now: new Date(),
    windowDays: settings.refundWindowDays,
    maxProgressPct: settings.refundMaxProgressPct,
    progressPcts: order.items.map(
      (item) =>
        enrollments.find((enrollment) => enrollment.courseId === item.courseId)?.progressPct ?? 0,
    ),
    certificateIssued: enrollments.some(
      (enrollment) => enrollment.certificate?.status === "ISSUED",
    ),
    existingRefundStatus: order.refunds[0]?.status ?? null,
  });
  if (!eligibility.allowed) throw conflict(eligibility.reason);

  return db.refund.create({
    data: {
      orderId: order.id,
      requestedById: input.user.id,
      reason,
      amountCents: order.totalCents,
      status: "REQUESTED",
    },
    select: { id: true },
  });
}
