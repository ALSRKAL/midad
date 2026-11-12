// @vitest-environment node
import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "@/server/db";
import { addCartItem, getCartView } from "@/server/cart";
import { fulfillCheckoutSession, recordWebhookEvent } from "@/server/checkout";
import { createCoupon } from "@/server/coupons-admin";
import { enrollFreeCourse } from "@/server/enrollment";
import type { SessionUser } from "@/server/session";

/**
 * Commerce integration tests (BR-07, BR-08, BR-09) against the dedicated `midad_test` database.
 *
 * The file skips when that database is not reachable so the unit-only CI job stays green; the
 * release pipeline runs it with Postgres available. Every row uses a random id, so repeated runs
 * never collide even though the ledger is append-only.
 */

let available = false;
try {
  await db.$queryRaw`SELECT 1`;
  available = true;
} catch {
  available = false;
}

const suffix = randomUUID().slice(0, 8);

async function makeInstructor() {
  const user = await db.user.create({
    data: {
      id: randomUUID(),
      name: "Integration Instructor",
      email: `instructor-${suffix}-${randomUUID().slice(0, 6)}@midad.test`,
      emailVerified: true,
      role: "INSTRUCTOR",
      status: "ACTIVE",
      locale: "AR",
      theme: "SYSTEM",
    },
  });
  const profile = await db.instructorProfile.create({
    data: { userId: user.id, approvedAt: new Date() },
  });
  return { user, profile };
}

async function makeCourse(input: {
  instructorProfileId: string;
  priceCents: number;
  isFree?: boolean;
}): Promise<string> {
  const category = await db.category.upsert({
    where: { slug: `integration-${suffix}` },
    create: { slug: `integration-${suffix}`, nameAr: "تكامل", nameEn: "Integration" },
    update: {},
    select: { id: true },
  });
  const course = await db.course.create({
    data: {
      slug: `integration-course-${randomUUID().slice(0, 8)}`,
      instructorId: input.instructorProfileId,
      categoryId: category.id,
      titleAr: "دورة تكامل",
      titleEn: "Integration course",
      status: "PUBLISHED",
      priceCents: input.priceCents,
      isFree: input.isFree ?? false,
    },
    select: { id: true },
  });
  return course.id;
}

async function makeBuyer(): Promise<SessionUser> {
  const user = await db.user.create({
    data: {
      id: randomUUID(),
      name: "Integration Buyer",
      email: `buyer-${suffix}-${randomUUID().slice(0, 6)}@midad.test`,
      emailVerified: true,
      role: "STUDENT",
      status: "ACTIVE",
      locale: "AR",
      theme: "SYSTEM",
    },
  });
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: "STUDENT",
    status: "ACTIVE",
    locale: "ar",
    emailVerified: true,
    impersonatedBy: null,
  };
}

async function makePendingOrder(input: {
  userId: string;
  courseId: string;
  instructorProfileId: string;
  totalCents: number;
  discountCents?: number;
  couponId?: string | null;
}) {
  const order = await db.order.create({
    data: {
      userId: input.userId,
      status: "PENDING",
      currency: "SAR",
      subtotalCents: input.totalCents + (input.discountCents ?? 0),
      discountCents: input.discountCents ?? 0,
      taxCents: 0,
      totalCents: input.totalCents,
      vatBps: 0,
      couponId: input.couponId ?? null,
      items: {
        create: {
          courseId: input.courseId,
          instructorProfileId: input.instructorProfileId,
          unitPriceCents: input.totalCents + (input.discountCents ?? 0),
          discountCents: input.discountCents ?? 0,
          commissionBps: 7000,
          instructorShareCents: Math.floor((input.totalCents * 7000) / 10_000),
          titleSnapshot: "دورة تكامل",
        },
      },
      payment: {
        create: {
          provider: "STRIPE",
          status: "PENDING",
          amountCents: input.totalCents,
          currency: "SAR",
        },
      },
    },
    select: { id: true },
  });
  return order.id;
}

describe.skipIf(!available)("commerce integration", () => {
  let instructorProfileId = "";
  let courseId = "";
  let buyer: SessionUser;

  beforeAll(async () => {
    const instructor = await makeInstructor();
    instructorProfileId = instructor.profile.id;
    courseId = await makeCourse({ instructorProfileId, priceCents: 10_000 });
    buyer = await makeBuyer();
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it("BR-08: ten concurrent deliveries of one event create one enrolment", async () => {
    const orderId = await makePendingOrder({
      userId: buyer.id,
      courseId,
      instructorProfileId,
      totalCents: 10_000,
    });
    const eventId = `evt_${randomUUID()}`;

    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        fulfillCheckoutSession({
          eventId,
          eventType: "checkout.session.completed",
          orderId,
          amountTotal: 10_000,
          currency: "sar",
          paymentIntentId: "pi_integration",
        }),
      ),
    );

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(await db.enrollment.count({ where: { orderId } })).toBe(1);
    expect(await db.ledgerEntry.count({ where: { orderId } })).toBe(1);
    expect(await db.processedWebhookEvent.count({ where: { id: eventId } })).toBe(1);
    expect(await db.payment.count({ where: { orderId, status: "SUCCEEDED" } })).toBe(1);
  });

  it("BR-08: duplicate event ids are recorded once and ignored", async () => {
    await recordWebhookEvent("evt_unhandled_integration", "customer.created");
    await recordWebhookEvent("evt_unhandled_integration", "customer.created");
    expect(
      await db.processedWebhookEvent.count({ where: { id: "evt_unhandled_integration" } }),
    ).toBe(1);
  });

  it("BR-07: two concurrent purchases of a cap-1 coupon consume it once", async () => {
    const coupon = await db.coupon.create({
      data: {
        code: `CAPONE${suffix}`.toUpperCase(),
        type: "FIXED",
        amountOffCents: 1_000,
        createdById: buyer.id,
        startsAt: new Date("2020-01-01T00:00:00.000Z"),
        endsAt: new Date("2035-01-01T00:00:00.000Z"),
        maxRedemptions: 1,
        maxPerUser: 1,
        minCartCents: 0,
      },
      select: { id: true },
    });
    const secondInstructor = await makeInstructor();
    const firstCouponCourse = await makeCourse({
      instructorProfileId,
      priceCents: 9_000,
    });
    const secondCourse = await makeCourse({
      instructorProfileId: secondInstructor.profile.id,
      priceCents: 8_000,
    });
    const secondBuyer = await makeBuyer();
    const firstOrder = await makePendingOrder({
      userId: buyer.id,
      courseId: firstCouponCourse,
      instructorProfileId,
      totalCents: 8_500,
      discountCents: 500,
      couponId: coupon.id,
    });
    const secondOrder = await makePendingOrder({
      userId: secondBuyer.id,
      courseId: secondCourse,
      instructorProfileId: secondInstructor.profile.id,
      totalCents: 7_000,
      discountCents: 1_000,
      couponId: coupon.id,
    });

    await Promise.all([
      fulfillCheckoutSession({
        eventId: `evt_${randomUUID()}`,
        eventType: "checkout.session.completed",
        orderId: firstOrder,
        amountTotal: 8_500,
        currency: "sar",
        paymentIntentId: null,
      }),
      fulfillCheckoutSession({
        eventId: `evt_${randomUUID()}`,
        eventType: "checkout.session.completed",
        orderId: secondOrder,
        amountTotal: 7_000,
        currency: "sar",
        paymentIntentId: null,
      }),
    ]);

    expect(await db.couponRedemption.count({ where: { couponId: coupon.id } })).toBe(1);
    expect(
      await db.enrollment.count({ where: { orderId: { in: [firstOrder, secondOrder] } } }),
    ).toBe(2);
  });

  it("BR-09: rejects purchase when already enrolled", async () => {
    const enrolledBuyer = await makeBuyer();
    await db.enrollment.create({
      data: { userId: enrolledBuyer.id, courseId, source: "PURCHASE", status: "ACTIVE" },
    });
    await expect(addCartItem(enrolledBuyer, courseId)).rejects.toThrow("ALREADY_ENROLLED");
  });

  it("BR-09: rejects instructor self-purchase", async () => {
    const ownBuyer = await makeBuyer();
    const instructor = await makeInstructor();
    const ownCourse = await makeCourse({
      instructorProfileId: instructor.profile.id,
      priceCents: 12_000,
    });
    const instructorSession: SessionUser = {
      ...ownBuyer,
      id: instructor.user.id,
      email: instructor.user.email,
      role: "INSTRUCTOR",
    };
    await expect(addCartItem(instructorSession, ownCourse)).rejects.toThrow(
      "SELF_PURCHASE_FORBIDDEN",
    );
  });

  it("BR-09: free course creates a FREE-source enrolment without Stripe", async () => {
    const freeBuyer = await makeBuyer();
    const freeCourse = await makeCourse({
      instructorProfileId,
      priceCents: 0,
      isFree: true,
    });

    const result = await enrollFreeCourse(freeBuyer.id, freeCourse);
    const enrollment = await db.enrollment.findUniqueOrThrow({
      where: { userId_courseId: { userId: freeBuyer.id, courseId: freeCourse } },
      select: { source: true, status: true, orderId: true },
    });
    expect(result.slug).toContain("integration-course");
    expect(enrollment).toEqual({ source: "FREE", status: "ACTIVE", orderId: null });
    expect(await db.order.count({ where: { userId: freeBuyer.id } })).toBe(0);
  });

  it("BR-07: instructor cannot create a coupon for another instructor's course", async () => {
    const owner = await makeInstructor();
    const other = await makeInstructor();
    const otherCourse = await makeCourse({
      instructorProfileId: other.profile.id,
      priceCents: 20_000,
    });
    const instructorSession: SessionUser = {
      id: owner.user.id,
      name: owner.user.name,
      email: owner.user.email,
      role: "INSTRUCTOR",
      status: "ACTIVE",
      locale: "ar",
      emailVerified: true,
      impersonatedBy: null,
    };

    await expect(
      createCoupon(instructorSession, {
        code: `STEAL${suffix}`,
        type: "PERCENTAGE",
        percentage: 50,
        amountOffCents: null,
        courseId: otherCourse,
        startsAt: new Date("2026-01-01T00:00:00.000Z"),
        endsAt: new Date("2030-01-01T00:00:00.000Z"),
        maxRedemptions: 10,
        maxPerUser: 1,
        minCartCents: 0,
      }),
    ).rejects.toThrow("COUPON_COURSE_NOT_OWNED");
  });

  it("BR-06: cart quote uses database prices, not any client value", async () => {
    const cartBuyer = await makeBuyer();
    await addCartItem(cartBuyer, courseId);
    const cart = await getCartView(cartBuyer, { couponCode: null });
    expect(cart.items).toHaveLength(1);
    expect(cart.quote.subtotalCents).toBe(10_000);
    expect(cart.quote.taxCents).toBe(1_500);
    expect(cart.quote.totalCents).toBe(11_500);
  });
});
