import { describe, expect, it } from "vitest";

import { evaluateCoupon, normaliseCouponCode, type CouponForEvaluation } from "@/lib/coupon-rules";

/**
 * BR-07 coupon rules. Each test is named with the rule id so the business-rule matrix can find it.
 * Time is injected: the suite never depends on the wall clock.
 */

const NOW = new Date("2026-06-15T12:00:00.000Z");

function coupon(overrides: Partial<CouponForEvaluation> = {}): CouponForEvaluation {
  return {
    id: "coupon-1",
    code: "SAVE20",
    type: "PERCENTAGE",
    percentage: 20,
    amountOffCents: null,
    courseId: null,
    startsAt: new Date("2026-06-01T00:00:00.000Z"),
    endsAt: new Date("2026-06-30T23:59:59.000Z"),
    maxRedemptions: 100,
    maxPerUser: 1,
    minCartCents: 0,
    isActive: true,
    ...overrides,
  };
}

function evaluate(
  value: CouponForEvaluation | null,
  lines = [
    { courseId: "course-a", unitPriceCents: 10_000 },
    { courseId: "course-b", unitPriceCents: 20_000 },
  ],
  overrides: Partial<Parameters<typeof evaluateCoupon>[0]> = {},
) {
  return evaluateCoupon({
    coupon: value,
    now: NOW,
    redemptions: 0,
    userRedemptions: 0,
    lines,
    ...overrides,
  });
}

describe("BR-07 coupon rules", () => {
  it("BR-07: rejects an unknown coupon", () => {
    expect(evaluate(null)).toEqual({ ok: false, code: "COUPON_NOT_FOUND" });
  });

  it("BR-07: rejects an inactive coupon", () => {
    expect(evaluate(coupon({ isActive: false }))).toEqual({ ok: false, code: "COUPON_INACTIVE" });
  });

  it("BR-07: rejects coupon before start date", () => {
    expect(evaluate(coupon({ startsAt: new Date("2026-07-01T00:00:00.000Z") }))).toEqual({
      ok: false,
      code: "COUPON_NOT_STARTED",
    });
  });

  it("BR-07: rejects expired coupon", () => {
    expect(evaluate(coupon({ endsAt: new Date("2026-06-01T00:00:00.000Z") }))).toEqual({
      ok: false,
      code: "COUPON_EXPIRED",
    });
  });

  it("BR-07: accepts a coupon exactly at its end instant", () => {
    const result = evaluate(coupon({ endsAt: NOW }));
    expect(result.ok).toBe(true);
  });

  it("BR-07: rejects when global cap reached", () => {
    expect(evaluate(coupon({ maxRedemptions: 5 }), undefined, { redemptions: 5 })).toEqual({
      ok: false,
      code: "COUPON_LIMIT_REACHED",
    });
  });

  it("BR-07: unlimited global redemptions when the cap is null", () => {
    const result = evaluate(coupon({ maxRedemptions: null }), undefined, { redemptions: 99_999 });
    expect(result.ok).toBe(true);
  });

  it("BR-07: rejects when per-user cap reached", () => {
    expect(evaluate(coupon({ maxPerUser: 1 }), undefined, { userRedemptions: 1 })).toEqual({
      ok: false,
      code: "COUPON_USER_LIMIT",
    });
  });

  it("BR-07: rejects below minimum cart value", () => {
    expect(evaluate(coupon({ minCartCents: 50_000 }))).toEqual({
      ok: false,
      code: "COUPON_MIN_CART",
    });
  });

  it("BR-07: rejects percentage above 100", () => {
    expect(evaluate(coupon({ percentage: 101 }))).toEqual({
      ok: false,
      code: "COUPON_INVALID",
    });
  });

  it("BR-07: rejects a zero percentage", () => {
    expect(evaluate(coupon({ percentage: 0 }))).toEqual({ ok: false, code: "COUPON_INVALID" });
  });

  it("BR-07: rejects a non-integer percentage", () => {
    expect(evaluate(coupon({ percentage: 12.5 }))).toEqual({
      ok: false,
      code: "COUPON_INVALID",
    });
  });

  it("BR-07: rejects a fixed coupon without an amount", () => {
    expect(evaluate(coupon({ type: "FIXED", percentage: null, amountOffCents: null }))).toEqual({
      ok: false,
      code: "COUPON_INVALID",
    });
  });

  it("BR-07: 100% discount yields zero total", () => {
    const result = evaluate(coupon({ percentage: 100 }));
    expect(result).toMatchObject({
      ok: true,
      discountCents: 30_000,
      lineDiscounts: [10_000, 20_000],
    });
  });

  it("BR-07: fixed discount larger than price floors at zero", () => {
    const result = evaluate(coupon({ type: "FIXED", percentage: null, amountOffCents: 500_000 }));
    expect(result).toMatchObject({
      ok: true,
      discountCents: 30_000,
      lineDiscounts: [10_000, 20_000],
    });
  });

  it("BR-07: platform fixed coupon is allocated across lines in order", () => {
    const result = evaluate(coupon({ type: "FIXED", percentage: null, amountOffCents: 15_000 }));
    expect(result).toMatchObject({
      ok: true,
      discountCents: 15_000,
      lineDiscounts: [10_000, 5_000],
    });
  });

  it("BR-07: course coupon discounts only its course", () => {
    const result = evaluate(coupon({ percentage: 50, courseId: "course-b" }));
    expect(result).toMatchObject({
      ok: true,
      discountCents: 10_000,
      lineDiscounts: [0, 10_000],
    });
  });

  it("BR-07: course coupon missing from the cart is not applicable", () => {
    expect(evaluate(coupon({ courseId: "course-z" }))).toEqual({
      ok: false,
      code: "COUPON_NOT_APPLICABLE",
    });
  });

  it("BR-07: percentage rounds half-to-even per line", () => {
    // 3,333 × 15% = 499.95 → 500; 3,334 × 15% = 500.1 → 500.
    const result = evaluate(coupon({ percentage: 15 }), [
      { courseId: "a", unitPriceCents: 3_333 },
      { courseId: "b", unitPriceCents: 3_334 },
    ]);
    expect(result).toMatchObject({ ok: true, lineDiscounts: [500, 500] });
  });

  it("BR-07: a free line stays zero under a percentage coupon", () => {
    const result = evaluate(coupon({ percentage: 30 }), [
      { courseId: "a", unitPriceCents: 0 },
      { courseId: "b", unitPriceCents: 1_000 },
    ]);
    expect(result).toMatchObject({ ok: true, lineDiscounts: [0, 300] });
  });

  it("BR-07: normalises coupon codes case-insensitively", () => {
    expect(normaliseCouponCode("  save20 ")).toBe("SAVE20");
  });
});
