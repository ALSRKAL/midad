/**
 * Coupon rules (BR-07), pure and shared by the cart, checkout and tests.
 *
 * The evaluator never reads the database and never trusts a client: the caller loads the coupon,
 * its redemption counts and the real course prices, then this function decides. A coupon applies to
 * every line for a platform-wide code, or only to its course for an instructor code. The result is
 * one discount per line so the invoice and the ledger can attribute the discount precisely.
 */

import { applyPercent } from "@/lib/money";

export type CouponTypeValue = "PERCENTAGE" | "FIXED";

export type CouponForEvaluation = {
  id: string;
  code: string;
  type: CouponTypeValue;
  percentage: number | null;
  amountOffCents: number | null;
  /** null = platform-wide; set = only this course (BR-07). */
  courseId: string | null;
  startsAt: Date;
  endsAt: Date;
  maxRedemptions: number | null;
  maxPerUser: number;
  minCartCents: number;
  isActive: boolean;
};

export type CouponLine = { courseId: string; unitPriceCents: number };

export const COUPON_ERROR_CODES = [
  "COUPON_NOT_FOUND",
  "COUPON_INACTIVE",
  "COUPON_NOT_STARTED",
  "COUPON_EXPIRED",
  "COUPON_LIMIT_REACHED",
  "COUPON_USER_LIMIT",
  "COUPON_MIN_CART",
  "COUPON_NOT_APPLICABLE",
  "COUPON_INVALID",
] as const;

export type CouponErrorCode = (typeof COUPON_ERROR_CODES)[number];

export type CouponEvaluation =
  | {
      ok: true;
      couponId: string;
      code: string;
      /** Discount per cart line, aligned with the input order. */
      lineDiscounts: number[];
      discountCents: number;
    }
  | { ok: false; code: CouponErrorCode };

export type CouponEvaluationInput = {
  coupon: CouponForEvaluation | null;
  now: Date;
  /** Successful redemptions of this coupon so far (reserved only on payment, BR-07). */
  redemptions: number;
  /** Successful redemptions by this user so far. Guests pass 0; the cap is enforced after sign-in. */
  userRedemptions: number;
  lines: readonly CouponLine[];
};

export function evaluateCoupon(input: CouponEvaluationInput): CouponEvaluation {
  const { coupon, now, redemptions, userRedemptions, lines } = input;
  if (coupon === null) return { ok: false, code: "COUPON_NOT_FOUND" };
  if (!coupon.isActive) return { ok: false, code: "COUPON_INACTIVE" };
  if (now.getTime() < coupon.startsAt.getTime()) return { ok: false, code: "COUPON_NOT_STARTED" };
  if (now.getTime() > coupon.endsAt.getTime()) return { ok: false, code: "COUPON_EXPIRED" };
  if (coupon.maxRedemptions !== null && redemptions >= coupon.maxRedemptions) {
    return { ok: false, code: "COUPON_LIMIT_REACHED" };
  }
  if (coupon.maxPerUser < 1 || userRedemptions >= coupon.maxPerUser) {
    return { ok: false, code: "COUPON_USER_LIMIT" };
  }

  const subtotalCents = lines.reduce((total, line) => total + line.unitPriceCents, 0);
  if (coupon.minCartCents > subtotalCents) return { ok: false, code: "COUPON_MIN_CART" };

  const eligible = lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => coupon.courseId === null || line.courseId === coupon.courseId);
  if (eligible.length === 0) return { ok: false, code: "COUPON_NOT_APPLICABLE" };

  const lineDiscounts = lines.map(() => 0);

  if (coupon.type === "PERCENTAGE") {
    if (
      coupon.percentage === null ||
      !Number.isInteger(coupon.percentage) ||
      coupon.percentage < 1 ||
      coupon.percentage > 100
    ) {
      return { ok: false, code: "COUPON_INVALID" };
    }
    for (const { line, index } of eligible) {
      lineDiscounts[index] = applyPercent(
        { amount: line.unitPriceCents, currency: "SAR" },
        coupon.percentage,
      ).amount;
    }
  } else {
    if (
      coupon.amountOffCents === null ||
      !Number.isInteger(coupon.amountOffCents) ||
      coupon.amountOffCents <= 0
    ) {
      return { ok: false, code: "COUPON_INVALID" };
    }
    // Fixed discount is a cart-level amount, allocated line by line and floored at each price so a
    // large coupon can never make a line negative (BR-07).
    let remaining = coupon.amountOffCents;
    for (const { line, index } of eligible) {
      if (remaining <= 0) break;
      const applied = Math.min(remaining, line.unitPriceCents);
      lineDiscounts[index] = applied;
      remaining -= applied;
    }
  }

  const discountCents = lineDiscounts.reduce((total, value) => total + value, 0);
  return {
    ok: true,
    couponId: coupon.id,
    code: coupon.code,
    lineDiscounts,
    discountCents,
  };
}

/** Normalises user input before lookup: coupon codes are case-insensitive and trimmed. */
export function normaliseCouponCode(raw: string): string {
  return raw.trim().toUpperCase();
}
