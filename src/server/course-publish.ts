/**
 * Publishing writes (BR-01, BR-02, BR-03; P04-T06).
 *
 * Pricing changes on a published course are audited in the same transaction. Submission recomputes
 * the checklist and moves the course to PENDING_REVIEW through the central state machine.
 */

import "server-only";

import { canSubmitForReview } from "@/lib/course-state";
import { conflict, notFound, validationFailed } from "@/lib/errors";
import { db } from "@/server/db";
import { getCourseChecklist } from "@/server/course-checklist";

export async function updateCoursePricing(
  instructorId: string,
  actorId: string,
  courseId: string,
  input: { isFree: boolean; priceCents: number },
): Promise<void> {
  if (!Number.isInteger(input.priceCents) || input.priceCents < 0) {
    throw validationFailed({ price: ["PRICE_INVALID"] });
  }
  if (input.priceCents > 100_000_000) {
    throw validationFailed({ price: ["PRICE_TOO_LARGE"] });
  }

  const course = await db.course.findFirst({
    where: { id: courseId, instructorId },
    select: { status: true, priceCents: true, isFree: true },
  });
  if (course === null) throw notFound("Course not found");

  const priceCents = input.isFree ? 0 : input.priceCents;
  if (!input.isFree && priceCents === 0) {
    throw validationFailed({ price: ["PRICE_REQUIRED"] });
  }

  const priceChanged = course.priceCents !== priceCents || course.isFree !== input.isFree;
  const shouldAudit = course.status === "PUBLISHED" && priceChanged;

  await db.$transaction([
    db.course.update({
      where: { id: courseId },
      data: { isFree: input.isFree, priceCents },
    }),
    ...(shouldAudit
      ? [
          db.auditLog.create({
            data: {
              actorId,
              action: "course.priceUpdated",
              entity: "Course",
              entityId: courseId,
              before: { priceCents: course.priceCents, isFree: course.isFree },
              after: { priceCents, isFree: input.isFree },
            },
          }),
        ]
      : []),
  ]);
}

export async function submitCourseForReview(
  instructorId: string,
  actorId: string,
  courseId: string,
): Promise<{ status: "PENDING_REVIEW" }> {
  const course = await db.course.findFirst({
    where: { id: courseId, instructorId },
    select: { status: true },
  });
  if (course === null) throw notFound("Course not found");
  if (!canSubmitForReview(course.status)) throw conflict("COURSE_NOT_SUBMITTABLE");

  const checklist = await getCourseChecklist(instructorId, courseId);
  if (!checklist.ready) throw conflict("COURSE_NOT_READY");

  await db.$transaction([
    db.course.update({
      where: { id: courseId },
      data: { status: "PENDING_REVIEW", rejectionReason: null },
    }),
    db.auditLog.create({
      data: {
        actorId,
        action: "course.submittedForReview",
        entity: "Course",
        entityId: courseId,
        before: { status: course.status },
        after: { status: "PENDING_REVIEW" },
      },
    }),
  ]);

  return { status: "PENDING_REVIEW" };
}
