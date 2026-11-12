// @vitest-environment node
import { randomUUID } from "node:crypto";

import { afterAll, describe, expect, it } from "vitest";

import { db } from "@/server/db";
import { createAnnouncement } from "@/server/announcements";
import {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/server/notifications";
import { deleteReview, reportReview, replyToReview, upsertReview } from "@/server/reviews";
import type { SessionUser } from "@/server/session";

/** BR-18 reviews plus P09 notifications, reports and announcements against `midad_test`. */

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
  role?: SessionUser["role"];
}): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role ?? "STUDENT",
    status: "ACTIVE",
    locale: "ar",
    emailVerified: true,
    impersonatedBy: null,
  };
}

async function makeUser(role: "STUDENT" | "INSTRUCTOR", name: string) {
  return db.user.create({
    data: {
      id: randomUUID(),
      name,
      email: `${role.toLowerCase()}-review-${suffix}-${randomUUID().slice(0, 6)}@midad.test`,
      emailVerified: true,
      role,
      status: "ACTIVE",
      locale: "AR",
      theme: "SYSTEM",
    },
  });
}

describe.skipIf(!available)("reviews, notifications and announcements integration", () => {
  afterAll(async () => {
    await db.$disconnect();
  });

  it("BR-18: enforces 20%, one review per learner, and keeps the aggregate atomic", async () => {
    const instructor = await makeUser("INSTRUCTOR", "Review Instructor");
    const profile = await db.instructorProfile.create({
      data: { userId: instructor.id, approvedAt: new Date() },
    });
    const category = await db.category.upsert({
      where: { slug: `review-${suffix}` },
      create: { slug: `review-${suffix}`, nameAr: "مراجعات", nameEn: "Reviews" },
      update: {},
      select: { id: true },
    });
    const course = await db.course.create({
      data: {
        slug: `review-course-${suffix}`,
        instructorId: profile.id,
        categoryId: category.id,
        titleAr: "دورة مراجعات",
        titleEn: "Reviews course",
        status: "PUBLISHED",
        priceCents: 0,
        isFree: true,
      },
      select: { id: true },
    });

    const first = await makeUser("STUDENT", "First Learner");
    const second = await makeUser("STUDENT", "Second Learner");
    const otherInstructor = await makeUser("INSTRUCTOR", "Other Instructor");
    await db.instructorProfile.create({
      data: { userId: otherInstructor.id, approvedAt: new Date() },
    });
    const firstEnrollment = await db.enrollment.create({
      data: {
        userId: first.id,
        courseId: course.id,
        source: "FREE",
        status: "ACTIVE",
        progressPct: 19,
      },
    });
    await db.enrollment.create({
      data: {
        userId: second.id,
        courseId: course.id,
        source: "FREE",
        status: "ACTIVE",
        progressPct: 40,
      },
    });

    await expect(
      upsertReview({ user: session(first), courseId: course.id, rating: 5, body: "ممتازة" }),
    ).rejects.toThrow("PROGRESS_TOO_LOW");

    await db.enrollment.update({ where: { id: firstEnrollment.id }, data: { progressPct: 20 } });
    const firstReview = await upsertReview({
      user: session(first),
      courseId: course.id,
      rating: 5,
      body: "ممتازة",
    });
    let rating = await db.course.findUniqueOrThrow({
      where: { id: course.id },
      select: { ratingAvg: true, ratingCount: true },
    });
    expect(rating).toEqual({ ratingAvg: 500, ratingCount: 1 });

    const secondReview = await upsertReview({
      user: session(second),
      courseId: course.id,
      rating: 3,
      body: "جيدة",
    });
    rating = await db.course.findUniqueOrThrow({
      where: { id: course.id },
      select: { ratingAvg: true, ratingCount: true },
    });
    expect(rating).toEqual({ ratingAvg: 400, ratingCount: 2 });

    const edited = await upsertReview({
      user: session(first),
      courseId: course.id,
      rating: 1,
      body: "تعديل",
    });
    expect(edited.id).toBe(firstReview.id);
    rating = await db.course.findUniqueOrThrow({
      where: { id: course.id },
      select: { ratingAvg: true, ratingCount: true },
    });
    expect(rating).toEqual({ ratingAvg: 200, ratingCount: 2 });

    await expect(
      replyToReview({
        user: session(otherInstructor),
        reviewId: firstReview.id,
        body: "رد مدرب آخر",
      }),
    ).rejects.toThrow("ONLY_COURSE_INSTRUCTOR_CAN_REPLY");
    await replyToReview({
      user: session(instructor),
      reviewId: firstReview.id,
      body: "شكرًا لملاحظاتك.",
    });
    expect(await db.notification.count({ where: { userId: first.id } })).toBeGreaterThan(0);

    await expect(
      reportReview({
        user: session(first),
        reviewId: firstReview.id,
        reason: "إبلاغ ذاتي",
        details: "",
      }),
    ).rejects.toThrow("CANNOT_REPORT_OWN_REVIEW");
    await reportReview({
      user: session(second),
      reviewId: firstReview.id,
      reason: "محتوى غير مناسب",
      details: "الوصف",
    });
    await expect(
      reportReview({
        user: session(second),
        reviewId: firstReview.id,
        reason: "تكرار",
        details: "",
      }),
    ).rejects.toThrow("ALREADY_REPORTED");

    await deleteReview(session(first), firstReview.id);
    const finalCourse = await db.course.findUniqueOrThrow({
      where: { id: course.id },
      select: { ratingAvg: true, ratingCount: true, reviews: { select: { id: true } } },
    });
    expect(finalCourse.ratingCount).toBe(1);
    expect(finalCourse.ratingAvg).toBe(300);
    expect(finalCourse.reviews.map((review) => review.id)).toEqual([secondReview.id]);
  });

  it("P09: notifications are private, counted and markable as read", async () => {
    const user = await makeUser("STUDENT", "Notified Learner");
    await db.notification.createMany({
      data: [
        {
          userId: user.id,
          type: "SYSTEM",
          title: "أول",
          body: "بدن",
          data: { titleEn: "First", bodyEn: "Body" },
        },
        {
          userId: user.id,
          type: "SYSTEM",
          title: "ثان",
          data: { titleEn: "Second" },
        },
      ],
    });
    expect(await getUnreadNotificationCount(user.id)).toBe(2);
    const english = await listNotifications(user.id, "en");
    expect(english.unread).toBe(2);
    expect(english.rows.map((row) => row.title).sort()).toEqual(["First", "Second"]);

    const stranger = await makeUser("STUDENT", "Stranger");
    const firstNotification = english.rows.find((row) => row.title === "First");
    expect(firstNotification).toBeDefined();
    await markNotificationRead(stranger.id, firstNotification?.id ?? "");
    expect(await getUnreadNotificationCount(user.id)).toBe(2);

    await markAllNotificationsRead(user.id);
    expect(await getUnreadNotificationCount(user.id)).toBe(0);
  });

  it("P09-T04: announcements notify and queue email for enrolled learners only", async () => {
    const instructor = await makeUser("INSTRUCTOR", "Announce Instructor");
    const profile = await db.instructorProfile.create({
      data: { userId: instructor.id, approvedAt: new Date() },
    });
    const category = await db.category.upsert({
      where: { slug: `announce-${suffix}` },
      create: { slug: `announce-${suffix}`, nameAr: "إعلانات", nameEn: "Announcements" },
      update: {},
      select: { id: true },
    });
    const course = await db.course.create({
      data: {
        slug: `announce-course-${suffix}`,
        instructorId: profile.id,
        categoryId: category.id,
        titleAr: "دورة إعلانات",
        titleEn: "Announcement course",
        status: "PUBLISHED",
        priceCents: 0,
        isFree: true,
      },
      select: { id: true },
    });
    const enrolled = await makeUser("STUDENT", "Enrolled Learner");
    const outsider = await makeUser("STUDENT", "Outside Learner");
    const muted = await makeUser("STUDENT", "Muted Learner");
    await db.user.update({ where: { id: muted.id }, data: { notifyAnnouncements: false } });
    await db.enrollment.createMany({
      data: [
        { userId: enrolled.id, courseId: course.id, source: "FREE", status: "ACTIVE" },
        { userId: muted.id, courseId: course.id, source: "FREE", status: "ACTIVE" },
      ],
    });

    await expect(
      createAnnouncement({
        user: session(outsider),
        courseId: course.id,
        title: "إعلان غير مصرح",
        body: "لا يملك هذا المستخدم صلاحية النشر في الدورة.",
      }),
    ).rejects.toThrow("ONLY_COURSE_INSTRUCTOR_CAN_ANNOUNCE");

    const created = await createAnnouncement({
      user: session(instructor),
      courseId: course.id,
      title: "درس جديد",
      body: "أضفنا درسًا جديدًا إلى الدورة، افتحه من المنهج.",
    });
    expect(created.id).not.toBe("");
    expect(
      await db.notification.count({ where: { userId: enrolled.id, type: "ANNOUNCEMENT" } }),
    ).toBe(1);
    expect(await db.notification.count({ where: { userId: muted.id, type: "ANNOUNCEMENT" } })).toBe(
      1,
    );
    expect(await db.notification.count({ where: { userId: outsider.id } })).toBe(0);
    expect(
      await db.emailJob.count({ where: { to: enrolled.email, template: "announcement" } }),
    ).toBe(1);
    expect(await db.emailJob.count({ where: { to: muted.email, template: "announcement" } })).toBe(
      0,
    );
  });
});
