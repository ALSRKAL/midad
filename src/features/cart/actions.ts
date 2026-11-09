"use server";

import { z } from "zod";

import { conflict, unauthorized } from "@/lib/errors";
import type { CouponErrorCode } from "@/lib/coupon-rules";
import { createAction } from "@/server/action";
import { rateLimiter } from "@/server/limiter";
import {
  addCartItem,
  clearCouponCode,
  getCartView,
  mergeGuestCart,
  removeCartItem,
  writeCouponCode,
} from "@/server/cart";
import { loadCoupon } from "@/server/coupons";
import { enrollFreeCourse } from "@/server/enrollment";

/** Cart mutations (P06-T01) and coupon application (P06-T02). */

const courseInput = z.object({
  courseId: z.string().min(1, { message: "COURSE_REQUIRED" }).max(64),
});

const addInternal = createAction<{ courseId: string }, { count: number; inCart: true }>({
  name: "cart.add",
  schema: courseInput,
  auth: "optional",
  handler: async ({ input, user }) => addCartItem(user, input.courseId),
});

const removeInternal = createAction<{ courseId: string }, { count: number; inCart: false }>({
  name: "cart.remove",
  schema: courseInput,
  auth: "optional",
  handler: async ({ input, user }) => removeCartItem(user, input.courseId),
});

const mergeInternal = createAction<void, { merged: number }>({
  name: "cart.merge",
  schema: z.undefined(),
  auth: "required",
  handler: async ({ user }) => {
    if (user === null) throw unauthorized();
    return mergeGuestCart(user.id);
  },
});

const applyCouponInternal = createAction<{ code: string }, { code: string; discountCents: number }>(
  {
    name: "cart.applyCoupon",
    schema: z.object({
      code: z
        .string()
        .trim()
        .min(1, { message: "COUPON_REQUIRED" })
        .max(40, { message: "COUPON_TOO_LONG" }),
    }),
    auth: "optional",
    // Coupon codes are guessable; throttle both the signed-in account and anonymous callers by IP.
    rateLimit: {
      key: ({ input, user, ip }) => `coupon:${user?.id ?? ip}:${input.code.trim().toLowerCase()}`,
      limit: 8,
      windowSec: 60,
      limiter: rateLimiter,
    },
    handler: async ({ input, user }) => {
      const cart = await getCartView(user);
      const lines = cart.items
        .filter((item) => item.availability === null)
        .map((item) => ({ courseId: item.id, unitPriceCents: item.priceCents }));
      if (lines.length === 0) throw conflict("CART_EMPTY");

      const lookup = await loadCoupon(input.code, user?.id ?? null, lines);
      if (lookup === null || lookup.coupon === null || !lookup.evaluation.ok) {
        const reason: CouponErrorCode =
          lookup === null || lookup.coupon === null || lookup.evaluation.ok
            ? "COUPON_NOT_FOUND"
            : lookup.evaluation.code;
        throw conflict(reason);
      }

      await writeCouponCode(lookup.coupon.code);
      return { code: lookup.coupon.code, discountCents: lookup.evaluation.discountCents };
    },
  },
);

const removeCouponInternal = createAction<void, { removed: true }>({
  name: "cart.removeCoupon",
  schema: z.undefined(),
  auth: "optional",
  handler: async () => {
    await clearCouponCode();
    return { removed: true };
  },
});

const enrollFreeInternal = createAction<
  { courseId: string },
  { slug: string; enrollmentId: string }
>({
  name: "enrollment.free",
  schema: courseInput,
  auth: "required",
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    return enrollFreeCourse(user.id, input.courseId);
  },
});

export async function addToCartAction(input: unknown) {
  return addInternal(input);
}
export async function removeFromCartAction(input: unknown) {
  return removeInternal(input);
}
export async function mergeGuestCartAction(input: unknown = undefined) {
  return mergeInternal(input);
}
export async function applyCouponAction(input: unknown) {
  return applyCouponInternal(input);
}
export async function removeCouponAction(input: unknown = undefined) {
  return removeCouponInternal(input);
}
export async function enrollFreeAction(input: unknown) {
  return enrollFreeInternal(input);
}
