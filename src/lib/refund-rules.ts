/**
 * Refund eligibility (BR-10), pure.
 *
 * A paid order is refundable for the configured window (14 days) while every enrolled course is
 * below the progress ceiling and no certificate has been issued. A request is one per order.
 */

export const REFUND_WINDOW_DAYS_DEFAULT = 14;
export const REFUND_MAX_PROGRESS_DEFAULT = 30;

export type RefundReasonCode =
  "NOT_PAID" | "ALREADY_REQUESTED" | "WINDOW_EXPIRED" | "CERTIFICATE_ISSUED" | "PROGRESS_TOO_HIGH";

export type RefundEligibility = { allowed: true } | { allowed: false; reason: RefundReasonCode };

export function refundEligibility(input: {
  status: "PENDING" | "PAID" | "FAILED" | "CANCELLED" | "REFUNDED" | "PARTIALLY_REFUNDED";
  paidAt: Date | null;
  now: Date;
  windowDays: number;
  maxProgressPct: number;
  progressPcts: readonly number[];
  certificateIssued: boolean;
  existingRefundStatus: "REQUESTED" | "APPROVED" | "COMPLETED" | "REJECTED" | null;
}): RefundEligibility {
  if (input.status !== "PAID" || input.paidAt === null) {
    return { allowed: false, reason: "NOT_PAID" };
  }
  if (input.existingRefundStatus !== null && input.existingRefundStatus !== "REJECTED") {
    return { allowed: false, reason: "ALREADY_REQUESTED" };
  }
  const windowMs = input.windowDays * 86_400_000;
  if (input.now.getTime() - input.paidAt.getTime() > windowMs) {
    return { allowed: false, reason: "WINDOW_EXPIRED" };
  }
  if (input.certificateIssued) {
    return { allowed: false, reason: "CERTIFICATE_ISSUED" };
  }
  if (input.progressPcts.some((progress) => progress >= input.maxProgressPct)) {
    return { allowed: false, reason: "PROGRESS_TOO_HIGH" };
  }
  return { allowed: true };
}
