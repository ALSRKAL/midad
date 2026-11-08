/**
 * Course review decisions (BR-01, P05-T02).
 *
 * Approval publishes; rejection sends the course back with a reason and per-checklist notes. Both
 * write the status change, the audit row and the instructor's in-app notification in one transaction,
 * then send the email outside it so an SMTP hiccup cannot roll back a decision.
 */

import "server-only";

import { canTransition, type CourseStatus } from "@/lib/course-state";
import { conflict, notFound } from "@/lib/errors";
import { env } from "@/env";
import { db } from "@/server/db";
import { logger } from "@/server/logger";
import { enqueueEmail } from "@/server/email-queue";

type DecisionContext = {
  courseId: string;
  titleAr: string | null;
  titleEn: string | null;
  status: CourseStatus;
  instructorUserId: string;
  instructorEmail: string;
  instructorName: string;
  instructorLocale: "AR" | "EN";
};

async function loadContext(courseId: string): Promise<DecisionContext> {
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      titleAr: true,
      titleEn: true,
      status: true,
      instructor: {
        select: {
          userId: true,
          user: { select: { name: true, email: true, locale: true } },
        },
      },
    },
  });
  if (course === null) throw notFound("Course not found");
  return {
    courseId: course.id,
    titleAr: course.titleAr,
    titleEn: course.titleEn,
    status: course.status,
    instructorUserId: course.instructor.userId,
    instructorEmail: course.instructor.user.email,
    instructorName: course.instructor.user.name,
    instructorLocale: course.instructor.user.locale,
  };
}

function titleOf(context: DecisionContext): string {
  return context.instructorLocale === "EN"
    ? (context.titleEn ?? context.titleAr ?? context.courseId)
    : (context.titleAr ?? context.titleEn ?? context.courseId);
}

function assertTransition(context: DecisionContext, target: CourseStatus): void {
  if (!canTransition(context.status, target)) {
    throw conflict("INVALID_TRANSITION");
  }
}

async function sendDecisionEmail(
  context: DecisionContext,
  approved: boolean,
  reason?: string,
): Promise<void> {
  try {
    const locale = context.instructorLocale === "EN" ? "en" : "ar";
    await enqueueEmail({
      to: context.instructorEmail,
      template: "course_review_decision",
      locale,
      data: {
        name: context.instructorName,
        courseTitle: titleOf(context),
        approved,
        reason: reason ?? null,
        url: `${env.APP_URL}/${locale}/instructor/courses/${context.courseId}/edit`,
      },
    });
  } catch (error) {
    // The decision is already committed; a failed enqueue is logged for retry, never a rollback.
    logger.error(
      { err: error, courseId: context.courseId },
      "course decision email enqueue failed",
    );
  }
}

export async function approveCourse(
  adminId: string,
  courseId: string,
  note: string | undefined,
): Promise<void> {
  const context = await loadContext(courseId);
  assertTransition(context, "PUBLISHED");
  const title = titleOf(context);
  const cleanNote = note?.trim() ?? "";

  await db.$transaction([
    db.course.update({
      where: { id: courseId },
      data: { status: "PUBLISHED", publishedAt: new Date(), rejectionReason: null },
    }),
    db.auditLog.create({
      data: {
        actorId: adminId,
        action: "course.approved",
        entity: "Course",
        entityId: courseId,
        before: { status: context.status },
        after: { status: "PUBLISHED" },
      },
    }),
    db.notification.create({
      data: {
        userId: context.instructorUserId,
        type: "COURSE_REVIEW_DECISION",
        title: context.instructorLocale === "EN" ? "Your course was published" : "تم نشر دورتك",
        body:
          context.instructorLocale === "EN"
            ? `The course “${title}” was approved and is now visible in the catalog.`
            : `تمت الموافقة على دورة «${title}» وهي ظاهرة الآن في الكتالوج.`,
        linkPath: `/instructor/courses/${courseId}/publish`,
      },
    }),
    ...(cleanNote === ""
      ? []
      : [
          db.courseReviewNote.create({
            data: { courseId, adminId, note: cleanNote },
          }),
        ]),
  ]);

  await sendDecisionEmail(context, true);
}

export async function rejectCourse(
  adminId: string,
  courseId: string,
  reason: string,
  notes: Array<{ label: string; note: string }>,
): Promise<void> {
  const context = await loadContext(courseId);
  assertTransition(context, "REJECTED");
  const title = titleOf(context);
  const cleanReason = reason.trim();
  if (cleanReason.length < 10) throw conflict("REASON_TOO_SHORT");

  const cleanNotes = notes
    .map((item) => ({ label: item.label.trim(), note: item.note.trim() }))
    .filter((item) => item.note !== "");

  await db.$transaction([
    db.course.update({
      where: { id: courseId },
      data: { status: "REJECTED", rejectionReason: cleanReason },
    }),
    db.auditLog.create({
      data: {
        actorId: adminId,
        action: "course.rejected",
        entity: "Course",
        entityId: courseId,
        before: { status: context.status },
        after: { status: "REJECTED", reason: cleanReason },
      },
    }),
    db.notification.create({
      data: {
        userId: context.instructorUserId,
        type: "COURSE_REVIEW_DECISION",
        title:
          context.instructorLocale === "EN" ? "Your course needs changes" : "دورتك تحتاج تعديلات",
        body:
          context.instructorLocale === "EN"
            ? `The course “${title}” was returned for changes: ${cleanReason}`
            : `أُعيدت دورة «${title}» للتعديل: ${cleanReason}`,
        linkPath: `/instructor/courses/${courseId}/publish`,
      },
    }),
    ...cleanNotes.map((item) =>
      db.courseReviewNote.create({
        data: {
          courseId,
          adminId,
          note: item.label === "" ? item.note : `${item.label}: ${item.note}`,
        },
      }),
    ),
  ]);

  await sendDecisionEmail(context, false, cleanReason);
}

export async function relistCourse(adminId: string, courseId: string): Promise<void> {
  const context = await loadContext(courseId);
  assertTransition(context, "PUBLISHED");
  await db.$transaction([
    db.course.update({ where: { id: courseId }, data: { status: "PUBLISHED" } }),
    db.auditLog.create({
      data: {
        actorId: adminId,
        action: "course.relisted",
        entity: "Course",
        entityId: courseId,
        before: { status: context.status },
        after: { status: "PUBLISHED" },
      },
    }),
  ]);
}

export async function unlistCourse(adminId: string, courseId: string): Promise<void> {
  const context = await loadContext(courseId);
  assertTransition(context, "UNLISTED");
  await db.$transaction([
    db.course.update({ where: { id: courseId }, data: { status: "UNLISTED" } }),
    db.auditLog.create({
      data: {
        actorId: adminId,
        action: "course.unlisted",
        entity: "Course",
        entityId: courseId,
        before: { status: context.status },
        after: { status: "UNLISTED" },
      },
    }),
  ]);
}

export async function archiveCourse(adminId: string, courseId: string): Promise<void> {
  const context = await loadContext(courseId);
  assertTransition(context, "ARCHIVED");
  await db.$transaction([
    db.course.update({
      where: { id: courseId },
      data: { status: "ARCHIVED", archivedAt: new Date() },
    }),
    db.auditLog.create({
      data: {
        actorId: adminId,
        action: "course.archived",
        entity: "Course",
        entityId: courseId,
        before: { status: context.status },
        after: { status: "ARCHIVED" },
      },
    }),
  ]);
}

/** Absolute link used in the email copy (kept here so tests can assert it if needed). */
export function courseReviewLink(locale: "AR" | "EN", courseId: string): string {
  const prefix = locale === "EN" ? "en" : "ar";
  return `${env.APP_URL.replace(/\/$/, "")}/${prefix}/instructor/courses/${courseId}/publish`;
}
