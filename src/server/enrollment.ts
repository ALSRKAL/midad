import "server-only";

import { conflict, notFound } from "@/lib/errors";
import { db } from "@/server/db";

/**
 * Free enrollment (P06-T06, BR-09).
 *
 * A zero-priced course becomes an active enrollment with source FREE and no order. The same
 * eligibility checks as checkout apply: the course must be published, the learner must not own it,
 * and an existing active enrollment is not duplicated.
 */
export async function enrollFreeCourse(
  userId: string,
  courseId: string,
): Promise<{ slug: string; enrollmentId: string }> {
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      slug: true,
      status: true,
      isFree: true,
      priceCents: true,
      instructor: { select: { userId: true } },
    },
  });
  if (course === null) throw notFound("Course not found");
  if (course.status !== "PUBLISHED") throw conflict("COURSE_UNAVAILABLE");
  if (!course.isFree || course.priceCents !== 0) throw conflict("COURSE_NOT_FREE");
  if (course.instructor.userId === userId) throw conflict("SELF_PURCHASE_FORBIDDEN");

  const existing = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { status: true },
  });
  if (existing?.status === "ACTIVE") throw conflict("ALREADY_ENROLLED");

  const enrollmentId = await db.$transaction(async (tx) => {
    const enrollment = await tx.enrollment.create({
      data: { userId, courseId, source: "FREE", status: "ACTIVE" },
      select: { id: true },
    });
    await tx.course.update({ where: { id: courseId }, data: { studentsCount: { increment: 1 } } });
    return enrollment.id;
  });

  return { slug: course.slug, enrollmentId };
}
