import "server-only";

import { refundEligibility } from "@/lib/refund-rules";
import { db } from "@/server/db";
import { getPlatformSettings } from "@/server/platform-settings";

/** Purchase history (P06-T06) plus refund state (P10-T03) for the owner's orders. */
export type PurchaseOrder = {
  id: string;
  status: "PENDING" | "PAID" | "FAILED" | "CANCELLED" | "REFUNDED" | "PARTIALLY_REFUNDED";
  totalCents: number;
  currency: "SAR" | "USD";
  createdAt: Date;
  paidAt: Date | null;
  items: Array<{ courseId: string; title: string; slug: string }>;
  refund: { status: "REQUESTED" | "APPROVED" | "COMPLETED" | "REJECTED"; reason: string } | null;
  refundEligible: boolean;
  /** Populated for a paid order that cannot be refunded, so the UI can state the reason. */
  refundBlockedReason:
    | "NOT_PAID"
    | "ALREADY_REQUESTED"
    | "WINDOW_EXPIRED"
    | "CERTIFICATE_ISSUED"
    | "PROGRESS_TOO_HIGH"
    | null;
};

export type FreeEnrollment = {
  id: string;
  createdAt: Date;
  course: { id: string; titleAr: string | null; titleEn: string | null; slug: string };
};

export async function listPurchases(userId: string): Promise<{
  orders: PurchaseOrder[];
  free: FreeEnrollment[];
  refundPolicy: { windowDays: number; maxProgressPct: number };
}> {
  const [orders, free, enrollments, settings] = await Promise.all([
    db.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        totalCents: true,
        currency: true,
        createdAt: true,
        paidAt: true,
        items: {
          select: {
            courseId: true,
            titleSnapshot: true,
            course: { select: { slug: true } },
          },
        },
        refunds: {
          orderBy: { createdAt: "desc" },
          select: { status: true, reason: true },
        },
      },
    }),
    db.enrollment.findMany({
      where: { userId, source: "FREE", status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        course: { select: { id: true, titleAr: true, titleEn: true, slug: true } },
      },
    }),
    db.enrollment.findMany({
      where: { userId, orderId: { not: null } },
      select: {
        orderId: true,
        courseId: true,
        progressPct: true,
        certificate: { select: { status: true } },
      },
    }),
    getPlatformSettings(),
  ]);

  const enrollmentByOrder = new Map<string, typeof enrollments>();
  for (const enrollment of enrollments) {
    if (enrollment.orderId === null) continue;
    const list = enrollmentByOrder.get(enrollment.orderId) ?? [];
    list.push(enrollment);
    enrollmentByOrder.set(enrollment.orderId, list);
  }

  const now = new Date();
  return {
    orders: orders.map((order) => {
      const orderEnrollments = enrollmentByOrder.get(order.id) ?? [];
      const latestRefund = order.refunds[0] ?? null;
      const eligibility = refundEligibility({
        status: order.status,
        paidAt: order.paidAt,
        now,
        windowDays: settings.refundWindowDays,
        maxProgressPct: settings.refundMaxProgressPct,
        progressPcts: order.items.map(
          (item) =>
            orderEnrollments.find((enrollment) => enrollment.courseId === item.courseId)
              ?.progressPct ?? 0,
        ),
        certificateIssued: orderEnrollments.some(
          (enrollment) => enrollment.certificate?.status === "ISSUED",
        ),
        existingRefundStatus: latestRefund?.status ?? null,
      });

      return {
        ...order,
        currency: order.currency === "USD" ? "USD" : "SAR",
        status: order.status,
        items: order.items.map((item) => ({
          courseId: item.courseId,
          title: item.titleSnapshot,
          slug: item.course.slug,
        })),
        refund: latestRefund,
        refundEligible: eligibility.allowed,
        refundBlockedReason: eligibility.allowed ? null : eligibility.reason,
      };
    }),
    free,
    refundPolicy: {
      windowDays: settings.refundWindowDays,
      maxProgressPct: settings.refundMaxProgressPct,
    },
  };
}
