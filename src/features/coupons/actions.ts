"use server";

import { z } from "zod";

import { validationFailed } from "@/lib/errors";
import { createAction } from "@/server/action";
import { createCoupon, setCouponActive } from "@/server/coupons-admin";
import { rateLimiter } from "@/server/limiter";

/** Coupon creation/deactivation (P06-T02). Both roles are re-checked server-side. */

const couponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(2, { message: "COUPON_CODE_TOO_SHORT" })
      .max(40, { message: "COUPON_CODE_TOO_LONG" })
      .regex(/^[A-Za-z0-9_-]+$/, { message: "COUPON_CODE_INVALID" }),
    type: z.enum(["PERCENTAGE", "FIXED"]),
    percentage: z.number().int().min(1).max(100).nullable(),
    amountOffCents: z.number().int().min(1).max(100_000_000).nullable(),
    courseId: z.string().min(1).max(64).nullable(),
    startsAt: z.iso.datetime({ offset: true }),
    endsAt: z.iso.datetime({ offset: true }),
    maxRedemptions: z.number().int().min(1).max(1_000_000).nullable(),
    maxPerUser: z.number().int().min(1).max(100),
    minCartCents: z.number().int().min(0).max(100_000_000),
  })
  .refine((value) => value.type !== "PERCENTAGE" || value.percentage !== null, {
    path: ["percentage"],
    message: "COUPON_PERCENTAGE_REQUIRED",
  })
  .refine((value) => value.type !== "FIXED" || value.amountOffCents !== null, {
    path: ["amountOffCents"],
    message: "COUPON_AMOUNT_REQUIRED",
  })
  .refine((value) => new Date(value.endsAt).getTime() > new Date(value.startsAt).getTime(), {
    path: ["endsAt"],
    message: "COUPON_DATES_INVALID",
  });

const createInternal = createAction<z.infer<typeof couponSchema>, { id: string }>({
  name: "coupon.create",
  schema: couponSchema,
  roles: ["INSTRUCTOR", "ADMIN"],
  rateLimit: {
    key: ({ user }) => `coupon:create:${user?.id ?? "anonymous"}`,
    limit: 30,
    windowSec: 3600,
    limiter: rateLimiter,
  },
  handler: async ({ input, user }) => {
    if (user === null) throw validationFailed({ form: ["UNAUTHORIZED"] });
    return createCoupon(user, {
      ...input,
      startsAt: new Date(input.startsAt),
      endsAt: new Date(input.endsAt),
    });
  },
});

const toggleInternal = createAction<{ couponId: string; isActive: boolean }, { ok: true }>({
  name: "coupon.toggle",
  schema: z.object({ couponId: z.string().min(1).max(64), isActive: z.boolean() }),
  roles: ["INSTRUCTOR", "ADMIN"],
  handler: async ({ input, user }) => {
    if (user === null) throw validationFailed({ form: ["UNAUTHORIZED"] });
    await setCouponActive(user, input.couponId, input.isActive);
    return { ok: true };
  },
});

export async function createCouponAction(input: unknown) {
  return createInternal(input);
}
export async function toggleCouponAction(input: unknown) {
  return toggleInternal(input);
}
