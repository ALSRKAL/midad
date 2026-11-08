import "server-only";

import {
  evaluateCoupon,
  normaliseCouponCode,
  type CouponEvaluation,
  type CouponForEvaluation,
  type CouponLine,
} from "@/lib/coupon-rules";
import { db } from "@/server/db";

/**
 * Coupon reads and evaluation for the cart (BR-07).
 *
 * Redemptions are created only by the payment webhook, so counting rows here is the same as counting
 * paid uses. A guest sees the discount preview with `userRedemptions = 0`; the per-user cap is
 * enforced again at checkout, where a user is mandatory.
 */

export type LoadedCoupon = {
  coupon: CouponForEvaluation | null;
  redemptions: number;
  userRedemptions: number;
  evaluation: CouponEvaluation;
};

export async function loadCoupon(
  code: string,
  userId: string | null,
  lines: CouponLine[],
): Promise<LoadedCoupon | null> {
  const normalised = normaliseCouponCode(code);
  if (normalised === "") return null;

  const row = await db.coupon.findUnique({
    where: { code: normalised },
    select: {
      id: true,
      code: true,
      type: true,
      percentage: true,
      amountOffCents: true,
      courseId: true,
      startsAt: true,
      endsAt: true,
      maxRedemptions: true,
      maxPerUser: true,
      minCartCents: true,
      isActive: true,
    },
  });
  if (row === null) {
    return {
      coupon: null,
      redemptions: 0,
      userRedemptions: 0,
      evaluation: { ok: false, code: "COUPON_NOT_FOUND" },
    };
  }

  const [redemptions, userRedemptions] = await Promise.all([
    db.couponRedemption.count({ where: { couponId: row.id } }),
    userId === null
      ? Promise.resolve(0)
      : db.couponRedemption.count({ where: { couponId: row.id, userId } }),
  ]);

  const coupon: CouponForEvaluation = {
    id: row.id,
    code: row.code,
    type: row.type,
    percentage: row.percentage,
    amountOffCents: row.amountOffCents,
    courseId: row.courseId,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    maxRedemptions: row.maxRedemptions,
    maxPerUser: row.maxPerUser,
    minCartCents: row.minCartCents,
    isActive: row.isActive,
  };

  return {
    coupon,
    redemptions,
    userRedemptions,
    evaluation: evaluateCoupon({
      coupon,
      now: new Date(),
      redemptions,
      userRedemptions,
      lines,
    }),
  };
}
