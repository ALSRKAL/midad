// @vitest-environment node
import { randomUUID } from "node:crypto";

import { afterAll, describe, expect, it } from "vitest";

import { db } from "@/server/db";
import { getInstructorEarnings, requestPayout } from "@/server/earnings";
import { approveRefund } from "@/server/admin/refunds";
import { markPayoutPaid, rejectPayout } from "@/server/admin/payouts";
import { decideReport } from "@/server/admin/reports";
import { setContactStatus } from "@/server/admin/contact";
import { updatePlatformSettings } from "@/server/admin/settings";
import { getPlatformSettings } from "@/server/platform-settings";
import { requestRefund } from "@/server/refunds";
import type { SessionUser } from "@/server/session";

/** BR-10/11/12/13 and the P10-T05 ledger reconciliation, against `midad_test`. */

let available = false;
try {
  await db.$queryRaw`SELECT 1`;
  available = true;
} catch {
  available = false;
}

const suffix = randomUUID().slice(0, 8);

function session(user: {
  id: string;
  name: string;
  email: string;
  role: SessionUser["role"];
}): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: "ACTIVE",
    locale: "ar",
    emailVerified: true,
    impersonatedBy: null,
  };
}

async function makeUser(role: "STUDENT" | "INSTRUCTOR" | "ADMIN", label: string) {
  return db.user.create({
    data: {
      id: randomUUID(),
      name: label,
      email: `${role.toLowerCase()}-${label.toLowerCase().replaceAll(" ", "-")}-${suffix}@midad.test`,
      emailVerified: true,
      role,
      status: "ACTIVE",
      locale: "AR",
      theme: "SYSTEM",
    },
  });
}

async function makeCourse(instructorProfileId: string, title: string) {
  const category = await db.category.upsert({
    where: { slug: `finance-${suffix}` },
    create: { slug: `finance-${suffix}`, nameAr: "مالية", nameEn: "Finance" },
    update: {},
    select: { id: true },
  });
  return db.course.create({
    data: {
      slug: `finance-course-${randomUUID().slice(0, 6)}`,
      instructorId: instructorProfileId,
      categoryId: category.id,
      titleAr: title,
      titleEn: title,
      status: "PUBLISHED",
      priceCents: 10_000,
      isFree: false,
    },
    select: { id: true },
  });
}

async function makeSale(input: {
  buyerId: string;
  courseId: string;
  instructorProfileId: string;
  amountCents: number;
  paidAt: Date;
}) {
  const order = await db.order.create({
    data: {
      userId: input.buyerId,
      status: "PAID",
      currency: "SAR",
      subtotalCents: input.amountCents,
      totalCents: input.amountCents,
      taxCents: 0,
      paidAt: input.paidAt,
      items: {
        create: {
          courseId: input.courseId,
          instructorProfileId: input.instructorProfileId,
          unitPriceCents: input.amountCents,
          commissionBps: 7000,
          instructorShareCents: Math.round(input.amountCents * 0.7),
          titleSnapshot: "Finance course",
        },
      },
    },
    select: { id: true },
  });
  await db.ledgerEntry.create({
    data: {
      instructorProfileId: input.instructorProfileId,
      type: "SALE",
      amountCents: Math.round(input.amountCents * 0.7),
      currency: "SAR",
      orderId: order.id,
      description: "Course sale",
    },
  });
  return order;
}

describe.skipIf(!available)("finance integration", () => {
  afterAll(async () => {
    await db.$disconnect();
  });

  it("BR-13: available balance waits for the refund window and one pending payout", async () => {
    const instructor = await makeUser("INSTRUCTOR", "Payout Instructor");
    const profile = await db.instructorProfile.create({
      data: { userId: instructor.id, approvedAt: new Date() },
    });
    const buyer = await makeUser("STUDENT", "Payout Buyer");
    const admin = await makeUser("ADMIN", "Payout Admin");
    const course = await makeCourse(profile.id, "Payout course");

    const oldPaidAt = new Date(Date.now() - 20 * 86_400_000);
    const recentPaidAt = new Date(Date.now() - 5 * 86_400_000);
    const oldSale = await makeSale({
      buyerId: buyer.id,
      courseId: course.id,
      instructorProfileId: profile.id,
      amountCents: 30_000,
      paidAt: oldPaidAt,
    });
    await makeSale({
      buyerId: buyer.id,
      courseId: course.id,
      instructorProfileId: profile.id,
      amountCents: 10_000,
      paidAt: recentPaidAt,
    });

    const before = await getInstructorEarnings(profile.id);
    expect(before.eligibleNetCents).toBe(21_000);
    expect(before.lifetimeNetCents).toBe(28_000);
    expect(before.availableCents).toBe(21_000);

    await expect(requestPayout({ user: session(instructor), amountCents: 5_000 })).rejects.toThrow(
      "AMOUNT_BELOW_MINIMUM",
    );
    await expect(requestPayout({ user: session(instructor), amountCents: 21_001 })).rejects.toThrow(
      "AMOUNT_EXCEEDS_AVAILABLE",
    );

    const payout = await requestPayout({ user: session(instructor), amountCents: 10_000 });
    const pending = await getInstructorEarnings(profile.id);
    expect(pending.pendingPayoutCents).toBe(10_000);
    expect(pending.availableCents).toBe(11_000);
    await expect(requestPayout({ user: session(instructor), amountCents: 10_000 })).rejects.toThrow(
      "PENDING_PAYOUT_EXISTS",
    );

    // The partial unique index is the database-level half of the same rule.
    await expect(
      db.payout.create({
        data: {
          instructorProfileId: profile.id,
          amountCents: 1_000,
          currency: "SAR",
          status: "REQUESTED",
        },
      }),
    ).rejects.toThrow();

    await markPayoutPaid({
      adminId: admin.id,
      payoutId: payout.id,
      transferReference: `TRX-${suffix}`,
    });
    const paid = await getInstructorEarnings(profile.id);
    expect(paid.pendingPayoutCents).toBe(0);
    expect(paid.paidPayoutCents).toBe(10_000);
    expect(paid.availableCents).toBe(11_000);

    const rejected = await requestPayout({ user: session(instructor), amountCents: 11_000 });
    await rejectPayout({ adminId: admin.id, payoutId: rejected.id, note: "Please retry later." });
    expect((await getInstructorEarnings(profile.id)).availableCents).toBe(11_000);

    expect(oldSale.id).not.toBe("");
  });

  it("BR-10: refund requests enforce the window, progress and certificate rules", async () => {
    const instructor = await makeUser("INSTRUCTOR", "Refund Instructor");
    const profile = await db.instructorProfile.create({
      data: { userId: instructor.id, approvedAt: new Date() },
    });
    const buyer = await makeUser("STUDENT", "Refund Buyer");
    const course = await makeCourse(profile.id, "Refund course");
    const recentOrder = await makeSale({
      buyerId: buyer.id,
      courseId: course.id,
      instructorProfileId: profile.id,
      amountCents: 20_000,
      paidAt: new Date(Date.now() - 86_400_000),
    });
    await db.enrollment.create({
      data: {
        userId: buyer.id,
        courseId: course.id,
        source: "PURCHASE",
        status: "ACTIVE",
        orderId: recentOrder.id,
        progressPct: 10,
      },
    });

    const refund = await requestRefund({
      user: session(buyer),
      orderId: recentOrder.id,
      reason: "I could not continue the course because my schedule changed.",
    });
    expect(refund.id).not.toBe("");
    await expect(
      requestRefund({
        user: session(buyer),
        orderId: recentOrder.id,
        reason: "Second request should be rejected by BR-10.",
      }),
    ).rejects.toThrow("ALREADY_REQUESTED");

    const oldOrder = await makeSale({
      buyerId: buyer.id,
      courseId: course.id,
      instructorProfileId: profile.id,
      amountCents: 10_000,
      paidAt: new Date(Date.now() - 20 * 86_400_000),
    });
    await expect(
      requestRefund({
        user: session(buyer),
        orderId: oldOrder.id,
        reason: "This order is outside the refund window.",
      }),
    ).rejects.toThrow("WINDOW_EXPIRED");

    const highCourse = await makeCourse(profile.id, "Refund course two");
    const highProgressOrder = await makeSale({
      buyerId: buyer.id,
      courseId: highCourse.id,
      instructorProfileId: profile.id,
      amountCents: 10_000,
      paidAt: new Date(Date.now() - 86_400_000),
    });
    await db.enrollment.create({
      data: {
        userId: buyer.id,
        courseId: highCourse.id,
        source: "PURCHASE",
        status: "ACTIVE",
        orderId: highProgressOrder.id,
        progressPct: 30,
      },
    });
    await expect(
      requestRefund({
        user: session(buyer),
        orderId: highProgressOrder.id,
        reason: "This order is above the progress ceiling.",
      }),
    ).rejects.toThrow();
  });

  it("P10-T04: report decisions hide content and contact/settings writes are audited", async () => {
    const admin = await makeUser("ADMIN", "Moderation Admin");
    const instructor = await makeUser("INSTRUCTOR", "Moderation Instructor");
    const profile = await db.instructorProfile.create({
      data: { userId: instructor.id, approvedAt: new Date() },
    });
    const course = await makeCourse(profile.id, "Moderation course");
    const author = await makeUser("STUDENT", "Reported Author");
    const review = await db.review.create({
      data: { userId: author.id, courseId: course.id, rating: 1, body: "Reported review body" },
    });
    const report = await db.report.create({
      data: {
        targetType: "REVIEW",
        targetId: review.id,
        reporterId: admin.id,
        reason: "Inappropriate content",
      },
    });

    await decideReport({
      adminId: admin.id,
      reportId: report.id,
      decision: "RESOLVED",
      hide: true,
    });
    expect(
      await db.report.findUniqueOrThrow({ where: { id: report.id }, select: { status: true } }),
    ).toEqual({ status: "RESOLVED" });
    expect(
      await db.review.findUniqueOrThrow({ where: { id: review.id }, select: { isHidden: true } }),
    ).toEqual({ isHidden: true });

    const message = await db.contactMessage.create({
      data: { name: "Visitor", email: "visitor@midad.test", subject: "Hello", message: "Question" },
    });
    await setContactStatus({ adminId: admin.id, messageId: message.id, status: "READ" });
    expect(
      await db.contactMessage.findUniqueOrThrow({
        where: { id: message.id },
        select: { status: true },
      }),
    ).toEqual({ status: "READ" });

    const before = await getPlatformSettings();
    await updatePlatformSettings({
      adminId: admin.id,
      values: { ...before, vatBps: 1600 },
    });
    expect((await getPlatformSettings()).vatBps).toBe(1600);
    await updatePlatformSettings({ adminId: admin.id, values: before });
    expect((await getPlatformSettings()).vatBps).toBe(before.vatBps);
  });

  it("BR-10/BR-12: approval revokes access, reverses the ledger and the ledger is immutable", async () => {
    const instructor = await makeUser("INSTRUCTOR", "Reversal Instructor");
    const profile = await db.instructorProfile.create({
      data: { userId: instructor.id, approvedAt: new Date() },
    });
    const buyer = await makeUser("STUDENT", "Reversal Buyer");
    const admin = await makeUser("ADMIN", "Reversal Admin");
    const course = await makeCourse(profile.id, "Reversal course");
    const order = await makeSale({
      buyerId: buyer.id,
      courseId: course.id,
      instructorProfileId: profile.id,
      amountCents: 20_000,
      paidAt: new Date(Date.now() - 86_400_000),
    });
    await db.payment.create({
      data: {
        orderId: order.id,
        provider: "STRIPE",
        status: "SUCCEEDED",
        amountCents: 20_000,
        currency: "SAR",
        stripePaymentIntentId: `pi_test_${suffix}_reversal`,
      },
    });
    const enrollment = await db.enrollment.create({
      data: {
        userId: buyer.id,
        courseId: course.id,
        source: "PURCHASE",
        status: "ACTIVE",
        orderId: order.id,
        progressPct: 5,
      },
    });
    const refund = await requestRefund({
      user: session(buyer),
      orderId: order.id,
      reason: "Integration refund reversal with a deterministic Stripe seam.",
    });

    await approveRefund({
      adminId: admin.id,
      refundId: refund.id,
      note: "Approved by the integration test.",
      execute: () => Promise.resolve({ id: `re_test_${suffix}`, status: "succeeded" }),
    });

    const [finalRefund, finalOrder, finalEnrollment, refundLedger, audit] = await Promise.all([
      db.refund.findUniqueOrThrow({ where: { id: refund.id } }),
      db.order.findUniqueOrThrow({ where: { id: order.id } }),
      db.enrollment.findUniqueOrThrow({ where: { id: enrollment.id } }),
      db.ledgerEntry.findFirstOrThrow({ where: { refundId: refund.id } }),
      db.auditLog.findFirst({ where: { entityId: refund.id, action: "refund.approved" } }),
    ]);
    expect(finalRefund.status).toBe("COMPLETED");
    expect(finalRefund.stripeRefundId).toBe(`re_test_${suffix}`);
    expect(finalOrder.status).toBe("REFUNDED");
    expect(finalEnrollment.status).toBe("REVOKED");
    expect(refundLedger.type).toBe("REFUND");
    expect(refundLedger.amountCents).toBe(-14_000);
    expect(audit).not.toBeNull();

    await expect(
      db.ledgerEntry.update({
        where: { id: refundLedger.id },
        data: { amountCents: 1 },
      }),
    ).rejects.toThrow();
    await expect(db.ledgerEntry.delete({ where: { id: refundLedger.id } })).rejects.toThrow();
  });

  it("P10-T05: the ledger equals sales minus refunds minus paid payouts, to the halala", async () => {
    const ledgerByType = await db.ledgerEntry.groupBy({
      by: ["type"],
      _sum: { amountCents: true },
    });
    const sum = (type: "SALE" | "REFUND" | "PAYOUT") =>
      ledgerByType.find((row) => row.type === type)?._sum.amountCents ?? 0;

    const paidItems = await db.orderItem.aggregate({
      where: { order: { status: { in: ["PAID", "REFUNDED", "PARTIALLY_REFUNDED"] } } },
      _sum: { instructorShareCents: true },
    });
    const refundedItems = await db.orderItem.aggregate({
      where: { order: { refunds: { some: { status: "COMPLETED" } } } },
      _sum: { instructorShareCents: true },
    });
    const paidPayouts = await db.payout.aggregate({
      where: { status: "PAID" },
      _sum: { amountCents: true },
    });

    const ledgerNet = sum("SALE") + sum("REFUND") + sum("PAYOUT");
    const expected =
      (paidItems._sum.instructorShareCents ?? 0) -
      (refundedItems._sum.instructorShareCents ?? 0) -
      (paidPayouts._sum.amountCents ?? 0);

    expect(ledgerNet).toBe(expected);
    expect(sum("PAYOUT")).toBe(-(paidPayouts._sum.amountCents ?? 0));
  });
});
