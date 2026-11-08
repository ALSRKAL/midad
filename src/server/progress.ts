import "server-only";

// Persistence layer for the pure rules in `@/lib/progress`; every export requires an active enrolment.
import type { Prisma } from "@/generated/prisma/client";
import { conflict, notFound } from "@/lib/errors";
import {
  addWatchedSegment,
  courseProgressPct,
  isWatchComplete,
  type WatchedSegment,
} from "@/lib/progress";
import { db } from "@/server/db";
import { issueCertificateIfEligible } from "@/server/certificates";

/**
 * Persisted learning progress (BR-14, BR-15).
 *
 * Only an active enrolment may write progress. Video completion uses the union of watched segments;
 * a seek to the end can never satisfy it. The course percentage is recomputed from published lessons
 * after every change, and the streak records one activity per Riyadh calendar day.
 */

export function riyadhDay(date: Date): Date {
  const key = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  return new Date(`${key}T00:00:00.000Z`);
}

/** Shared streak upsert so the hot heartbeat can batch it with the progress write. */
export function streakUpsert(userId: string, now = new Date()) {
  const day = riyadhDay(now);
  return {
    where: { userId_day: { userId, day } },
    create: { userId, day, activityCount: 1 },
    update: { activityCount: { increment: 1 } },
  };
}

export async function recordStreak(
  tx: Prisma.TransactionClient,
  userId: string,
  now = new Date(),
): Promise<void> {
  await tx.streakDay.upsert(streakUpsert(userId, now));
}

export async function recomputeEnrollmentProgress(
  tx: Prisma.TransactionClient,
  userId: string,
  courseId: string,
): Promise<number> {
  const enrollment = await tx.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { id: true, completedAt: true },
  });
  if (enrollment === null) throw notFound("Enrollment not found");

  const [publishedLessons, completedLessons] = await Promise.all([
    tx.lesson.count({ where: { section: { courseId } } }),
    tx.lessonProgress.count({
      where: {
        enrollmentId: enrollment.id,
        completedAt: { not: null },
        lesson: { section: { courseId } },
      },
    }),
  ]);
  const pct = courseProgressPct(completedLessons, publishedLessons);

  await tx.enrollment.update({
    where: { id: enrollment.id },
    data: {
      progressPct: pct,
      ...(pct === 100 && enrollment.completedAt === null ? { completedAt: new Date() } : {}),
    },
  });
  return pct;
}

async function requireEnrollment(userId: string, lessonId: string) {
  // One round trip resolves the lesson, the caller's enrolment and that enrolment's row for this
  // lesson. The progress heartbeat is the hottest write path under load (P15-T02); the previous
  // three serial queries put the action over its 300 ms p95 budget.
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      type: true,
      isPreview: true,
      section: {
        select: {
          courseId: true,
          course: {
            select: {
              id: true,
              status: true,
              instructor: { select: { userId: true } },
              enrollments: {
                where: { userId },
                select: {
                  id: true,
                  status: true,
                  progressPct: true,
                  lessonProgress: {
                    where: { lessonId },
                    select: {
                      watchedSegments: true,
                      completedAt: true,
                      lastPositionSec: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      videoAsset: { select: { durationSec: true, status: true } },
    },
  });
  if (lesson === null) throw notFound("Lesson not found");
  const enrollment = lesson.section.course.enrollments[0];
  if (enrollment?.status !== "ACTIVE") throw conflict("ENROLLMENT_REQUIRED");
  return { lesson, enrollment, progress: enrollment.lessonProgress[0] ?? null };
}

function parseSegments(value: unknown, durationSec: number): WatchedSegment[] {
  if (!Array.isArray(value)) return [];
  const segments: WatchedSegment[] = [];
  for (const entry of value) {
    if (
      Array.isArray(entry) &&
      entry.length === 2 &&
      typeof entry[0] === "number" &&
      typeof entry[1] === "number"
    ) {
      segments.push([entry[0], entry[1]]);
    }
  }
  return segments.filter(([start, end]) => end > start && start < durationSec);
}

export type WatchResult = { progressPct: number; lessonCompleted: boolean };

export async function saveWatchProgress(input: {
  userId: string;
  lessonId: string;
  startSec: number;
  endSec: number;
  positionSec: number;
}): Promise<WatchResult> {
  const {
    lesson,
    enrollment,
    progress: existing,
  } = await requireEnrollment(input.userId, input.lessonId);
  if (lesson.type !== "VIDEO") throw conflict("NOT_A_VIDEO_LESSON");
  if (lesson.videoAsset?.status !== "READY" || lesson.videoAsset.durationSec <= 0) {
    throw conflict("VIDEO_NOT_READY");
  }
  const duration = lesson.videoAsset.durationSec;

  const previous = parseSegments(existing?.watchedSegments, duration);
  const merged = addWatchedSegment(previous, input.startSec, input.endSec, duration);
  const completed = existing !== null && existing.completedAt !== null;
  const reachedThreshold = isWatchComplete(merged, duration);

  // Repeated heartbeats for an already-watched segment (pause, visibility change, retry) must not
  // take a write transaction and recompute the whole course. The player sends these often, and
  // under load they were the largest source of write contention (P14-T04).
  if (
    existing !== null &&
    JSON.stringify(merged) === JSON.stringify(previous) &&
    Math.max(0, Math.floor(input.positionSec)) === existing.lastPositionSec
  ) {
    return { progressPct: enrollment.progressPct, lessonCompleted: completed };
  }

  // Only a lesson that just crossed the 90% threshold can change the course percentage. A normal
  // heartbeat updates two rows and does not recount every lesson in the course (P15-T02).
  const newlyCompleted = !completed && reachedThreshold;
  const progressWrite = {
    where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId: lesson.id } },
    create: {
      enrollmentId: enrollment.id,
      lessonId: lesson.id,
      watchedSegments: merged,
      lastPositionSec: Math.max(0, Math.floor(input.positionSec)),
      completedAt: reachedThreshold ? new Date() : null,
    },
    update: {
      watchedSegments: merged,
      lastPositionSec: Math.max(0, Math.floor(input.positionSec)),
      ...(newlyCompleted ? { completedAt: new Date() } : {}),
    },
  };

  if (!newlyCompleted) {
    // A batch transaction is one round trip: progress upsert + streak increment. The interactive
    // transaction (BEGIN/COMMIT plus a count query) is reserved for the rare completion transition.
    await db.$transaction([
      db.lessonProgress.upsert(progressWrite),
      db.streakDay.upsert(streakUpsert(input.userId)),
    ]);
    return { progressPct: enrollment.progressPct, lessonCompleted: completed || reachedThreshold };
  }

  const result = await db.$transaction(async (tx) => {
    await tx.lessonProgress.upsert(progressWrite);
    const progressPct = await recomputeEnrollmentProgress(
      tx,
      input.userId,
      lesson.section.courseId,
    );
    await recordStreak(tx, input.userId);
    return { progressPct, lessonCompleted: true };
  });

  if (result.progressPct === 100) {
    await issueCertificateIfEligible(input.userId, lesson.section.courseId);
  }
  return result;
}

export async function setLessonCompleted(input: {
  userId: string;
  lessonId: string;
  completed: boolean;
}): Promise<WatchResult> {
  const { lesson, enrollment } = await requireEnrollment(input.userId, input.lessonId);
  if (lesson.type === "QUIZ") throw conflict("QUIZ_REQUIRES_PASS");

  const result = await db.$transaction(async (tx) => {
    await tx.lessonProgress.upsert({
      where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId: lesson.id } },
      create: {
        enrollmentId: enrollment.id,
        lessonId: lesson.id,
        completedAt: input.completed ? new Date() : null,
      },
      update: { completedAt: input.completed ? new Date() : null },
    });
    const progressPct = await recomputeEnrollmentProgress(
      tx,
      input.userId,
      lesson.section.courseId,
    );
    await recordStreak(tx, input.userId);
    return { progressPct, lessonCompleted: input.completed };
  });
  if (result.progressPct === 100) {
    await issueCertificateIfEligible(input.userId, lesson.section.courseId);
  }
  return result;
}
