import "server-only";

import { env } from "@/env";
import { conflict, forbidden, notFound, validationFailed } from "@/lib/errors";
import { averageRating, isValidRating, reviewEligibility } from "@/lib/review-rules";
import { db } from "@/server/db";
import { enqueueEmail } from "@/server/email-queue";
import { createNotification } from "@/server/notifications";
import { getPlatformSettings } from "@/server/platform-settings";
import type { SessionUser } from "@/server/session";

/**
 * Course reviews (P09-T01, BR-18).
 *
 * Eligibility is rechecked from the database on every write. A review is one per (user, course) and
 * editable; the denormalised course rating is recomputed inside the same transaction as the review
 * change, so the catalogue can never show a stale average.
 */

export type ReviewContext = {
  enrolled: boolean;
  progressPct: number;
  minProgressPct: number;
  review: {
    id: string;
    rating: number;
    body: string | null;
    instructorReply: string | null;
    createdAt: Date;
  } | null;
};

export async function getReviewContext(
  user: SessionUser | null,
  courseId: string,
): Promise<ReviewContext> {
  const settings = await getPlatformSettings();
  if (user === null) {
    return {
      enrolled: false,
      progressPct: 0,
      minProgressPct: settings.reviewMinProgressPct,
      review: null,
    };
  }
  const [enrollment, review] = await Promise.all([
    db.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId } },
      select: { status: true, progressPct: true },
    }),
    db.review.findUnique({
      where: { userId_courseId: { userId: user.id, courseId } },
      select: {
        id: true,
        rating: true,
        body: true,
        instructorReply: true,
        createdAt: true,
      },
    }),
  ]);
  return {
    enrolled: enrollment?.status === "ACTIVE",
    progressPct: enrollment?.progressPct ?? 0,
    minProgressPct: settings.reviewMinProgressPct,
    review,
  };
}

async function refreshAggregate(
  tx: Parameters<Parameters<typeof db.$transaction>[0]>[0],
  courseId: string,
): Promise<void> {
  const reviews = await tx.review.findMany({
    where: { courseId, isHidden: false },
    select: { rating: true },
  });
  const aggregate = averageRating(reviews.map((review) => review.rating));
  await tx.course.update({
    where: { id: courseId },
    data: { ratingAvg: aggregate.averageX100, ratingCount: aggregate.count },
  });
}

export async function upsertReview(input: {
  user: SessionUser;
  courseId: string;
  rating: number;
  body: string;
}): Promise<{ id: string }> {
  const body = input.body.trim();
  if (!isValidRating(input.rating)) {
    throw validationFailed({ rating: ["RATING_INVALID"] }, "Invalid rating");
  }
  if (body.length > 2000) throw validationFailed({ body: ["REVIEW_TOO_LONG"] });

  const settings = await getPlatformSettings();
  const [enrollment, course] = await Promise.all([
    db.enrollment.findUnique({
      where: { userId_courseId: { userId: input.user.id, courseId: input.courseId } },
      select: { status: true, progressPct: true },
    }),
    db.course.findUnique({
      where: { id: input.courseId },
      select: { slug: true, instructor: { select: { userId: true } } },
    }),
  ]);
  if (course === null) throw notFound("Course not found");
  const eligibility = reviewEligibility({
    enrolled: enrollment?.status === "ACTIVE",
    progressPct: enrollment?.progressPct ?? 0,
    minProgressPct: settings.reviewMinProgressPct,
  });
  if (!eligibility.allowed) throw forbidden(eligibility.reason);

  const review = await db.$transaction(async (tx) => {
    const saved = await tx.review.upsert({
      where: {
        userId_courseId: { userId: input.user.id, courseId: input.courseId },
      },
      create: {
        userId: input.user.id,
        courseId: input.courseId,
        rating: input.rating,
        body: body === "" ? null : body,
      },
      update: { rating: input.rating, body: body === "" ? null : body },
      select: { id: true },
    });
    await refreshAggregate(tx, input.courseId);
    return saved;
  });

  if (course.instructor.userId !== input.user.id) {
    await createNotification({
      userId: course.instructor.userId,
      type: "SYSTEM",
      title: { ar: "تقييم جديد على دورتك", en: "A new review on your course" },
      body: {
        ar: `أضاف ${input.user.name} تقييمًا جديدًا (${input.rating}/5).`,
        en: `${input.user.name} left a new review (${input.rating}/5).`,
      },
      linkPath: `/courses/${course.slug}#reviews-title`,
    });
  }
  return review;
}

export async function deleteReview(user: SessionUser, reviewId: string): Promise<void> {
  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: { id: true, userId: true, courseId: true },
  });
  if (review === null) throw notFound("Review not found");
  if (review.userId !== user.id) throw forbidden();
  await db.$transaction(async (tx) => {
    await tx.review.delete({ where: { id: review.id } });
    await refreshAggregate(tx, review.courseId);
  });
}

export async function replyToReview(input: {
  user: SessionUser;
  reviewId: string;
  body: string;
}): Promise<void> {
  const body = input.body.trim();
  if (body.length < 2) throw validationFailed({ body: ["REPLY_TOO_SHORT"] });
  if (body.length > 2000) throw validationFailed({ body: ["REPLY_TOO_LONG"] });

  const review = await db.review.findUnique({
    where: { id: input.reviewId },
    select: {
      id: true,
      userId: true,
      courseId: true,
      user: { select: { name: true, email: true, locale: true, notifyReplies: true } },
      course: {
        select: {
          slug: true,
          titleAr: true,
          titleEn: true,
          instructor: { select: { userId: true } },
        },
      },
    },
  });
  if (review === null) throw notFound("Review not found");
  if (review.course.instructor.userId !== input.user.id && input.user.role !== "ADMIN") {
    throw forbidden("ONLY_COURSE_INSTRUCTOR_CAN_REPLY");
  }

  await db.review.update({
    where: { id: review.id },
    data: { instructorReply: body, instructorRepliedAt: new Date() },
  });
  if (review.userId !== input.user.id) {
    await createNotification({
      userId: review.userId,
      type: "QUESTION_ANSWERED",
      title: { ar: "ردّ المدرب على تقييمك", en: "The instructor replied to your review" },
      body: { ar: body, en: body },
      linkPath: `/courses/${review.course.slug}#reviews-title`,
    });
    if (review.user.notifyReplies) {
      const locale = review.user.locale === "EN" ? "en" : "ar";
      await enqueueEmail({
        to: review.user.email,
        template: "review_reply",
        locale,
        data: {
          name: review.user.name,
          courseTitle:
            locale === "en"
              ? (review.course.titleEn ?? review.course.titleAr)
              : (review.course.titleAr ?? review.course.titleEn),
          reply: body,
          url: `${env.APP_URL}/${locale}/courses/${review.course.slug}#reviews-title`,
        },
      });
    }
  }
}

export async function reportReview(input: {
  user: SessionUser;
  reviewId: string;
  reason: string;
  details: string;
}): Promise<void> {
  const reason = input.reason.trim();
  if (reason.length < 3) throw validationFailed({ reason: ["REPORT_REASON_REQUIRED"] });

  const review = await db.review.findUnique({
    where: { id: input.reviewId },
    select: { id: true, userId: true },
  });
  if (review === null) throw notFound("Review not found");
  if (review.userId === input.user.id) throw conflict("CANNOT_REPORT_OWN_REVIEW");

  const existing = await db.report.findFirst({
    where: {
      targetType: "REVIEW",
      targetId: review.id,
      reporterId: input.user.id,
      status: "OPEN",
    },
    select: { id: true },
  });
  if (existing !== null) throw conflict("ALREADY_REPORTED");

  await db.report.create({
    data: {
      targetType: "REVIEW",
      targetId: review.id,
      reporterId: input.user.id,
      reason,
      details: input.details.trim() === "" ? null : input.details.trim(),
    },
  });
}
