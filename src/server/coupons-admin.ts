import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { conflict, forbidden, notFound } from "@/lib/errors";
import { normaliseCouponCode } from "@/lib/coupon-rules";
import { db } from "@/server/db";
import type { SessionUser } from "@/server/session";

/**
 * Coupon administration (P06-T02, BR-07).
 *
 * Admins may create platform-wide coupons or coupons for any course. Instructors may only create a
 * coupon for a course they own; a direct call for someone else's course is refused here, not merely
 * hidden in the UI. Codes are normalised to upper case and unique.
 */

export type CouponInput = {
  code: string;
  type: "PERCENTAGE" | "FIXED";
  percentage: number | null;
  amountOffCents: number | null;
  courseId: string | null;
  startsAt: Date;
  endsAt: Date;
  maxRedemptions: number | null;
  maxPerUser: number;
  minCartCents: number;
};

export type CouponRow = {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED";
  percentage: number | null;
  amountOffCents: number | null;
  courseTitleAr: string | null;
  courseTitleEn: string | null;
  startsAt: Date;
  endsAt: Date;
  maxRedemptions: number | null;
  maxPerUser: number;
  minCartCents: number;
  isActive: boolean;
  redemptionCount: number;
  createdByName: string;
};

async function assertCourseScope(actor: SessionUser, courseId: string | null): Promise<void> {
  if (actor.role === "ADMIN") {
    if (courseId !== null) {
      const course = await db.course.findUnique({ where: { id: courseId }, select: { id: true } });
      if (course === null) throw notFound("Course not found");
    }
    return;
  }

  if (courseId === null) throw forbidden("INSTRUCTOR_COUPON_REQUIRES_COURSE");
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { instructor: { select: { userId: true } } },
  });
  if (course === null) throw notFound("Course not found");
  if (course.instructor.userId !== actor.id) throw forbidden("COUPON_COURSE_NOT_OWNED");
}

export async function createCoupon(
  actor: SessionUser,
  input: CouponInput,
): Promise<{ id: string }> {
  await assertCourseScope(actor, input.courseId);

  try {
    const coupon = await db.coupon.create({
      data: {
        code: normaliseCouponCode(input.code),
        type: input.type,
        percentage: input.type === "PERCENTAGE" ? input.percentage : null,
        amountOffCents: input.type === "FIXED" ? input.amountOffCents : null,
        courseId: input.courseId,
        createdById: actor.id,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        maxRedemptions: input.maxRedemptions,
        maxPerUser: input.maxPerUser,
        minCartCents: input.minCartCents,
        isActive: true,
      },
      select: { id: true },
    });
    await db.auditLog.create({
      data: {
        actorId: actor.id,
        action: "coupon.created",
        entity: "Coupon",
        entityId: coupon.id,
        after: {
          code: normaliseCouponCode(input.code),
          type: input.type,
          courseId: input.courseId,
          percentage: input.percentage,
          amountOffCents: input.amountOffCents,
        },
      },
    });
    return coupon;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw conflict("COUPON_CODE_TAKEN");
    }
    throw error;
  }
}

export async function setCouponActive(
  actor: SessionUser,
  couponId: string,
  isActive: boolean,
): Promise<void> {
  const coupon = await db.coupon.findUnique({
    where: { id: couponId },
    select: { id: true, createdById: true, courseId: true, isActive: true },
  });
  if (coupon === null) throw notFound("Coupon not found");
  if (actor.role !== "ADMIN" && coupon.createdById !== actor.id) throw forbidden();

  await db.$transaction([
    db.coupon.update({ where: { id: couponId }, data: { isActive } }),
    db.auditLog.create({
      data: {
        actorId: actor.id,
        action: "coupon.updated",
        entity: "Coupon",
        entityId: couponId,
        before: { isActive: coupon.isActive },
        after: { isActive },
      },
    }),
  ]);
}

export async function listCoupons(actor: SessionUser): Promise<CouponRow[]> {
  const rows = await db.coupon.findMany({
    where: actor.role === "ADMIN" ? {} : { createdById: actor.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      code: true,
      type: true,
      percentage: true,
      amountOffCents: true,
      startsAt: true,
      endsAt: true,
      maxRedemptions: true,
      maxPerUser: true,
      minCartCents: true,
      isActive: true,
      course: { select: { titleAr: true, titleEn: true } },
      createdBy: { select: { name: true } },
      _count: { select: { redemptions: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    type: row.type,
    percentage: row.percentage,
    amountOffCents: row.amountOffCents,
    courseTitleAr: row.course?.titleAr ?? null,
    courseTitleEn: row.course?.titleEn ?? null,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    maxRedemptions: row.maxRedemptions,
    maxPerUser: row.maxPerUser,
    minCartCents: row.minCartCents,
    isActive: row.isActive,
    redemptionCount: row._count.redemptions,
    createdByName: row.createdBy.name,
  }));
}

/** Courses an actor may scope a coupon to. */
export async function listCouponCourses(
  actor: SessionUser,
): Promise<Array<{ id: string; titleAr: string | null; titleEn: string | null }>> {
  return db.course.findMany({
    where: {
      status: { in: ["PUBLISHED", "UNLISTED"] },
      ...(actor.role === "ADMIN" ? {} : { instructor: { userId: actor.id } }),
    },
    orderBy: { titleAr: "asc" },
    select: { id: true, titleAr: true, titleEn: true },
  });
}
