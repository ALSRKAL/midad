import "server-only";

import { db } from "@/server/db";
import { riyadhDay } from "@/server/progress";

/** Student dashboard data (P07-T01): resume point, enrolled courses, streaks and certificates. */

export type DashboardCourse = {
  enrollmentId: string;
  courseId: string;
  slug: string;
  titleAr: string | null;
  titleEn: string | null;
  coverImageKey: string | null;
  status: string;
  progressPct: number;
  totalDurationSec: number;
  instructorName: string;
  certificateCode: string | null;
};

export type ResumePoint = {
  courseSlug: string;
  courseTitleAr: string | null;
  courseTitleEn: string | null;
  lessonId: string;
  lessonTitleAr: string;
  lessonTitleEn: string;
  lessonType: "VIDEO" | "TEXT" | "FILE" | "QUIZ";
  positionSec: number;
  progressPct: number;
};

export type StudentDashboard = {
  courses: DashboardCourse[];
  resume: ResumePoint | null;
  streak: { current: number; longest: number };
  certificates: Array<{
    code: string;
    courseTitleAr: string | null;
    courseTitleEn: string | null;
    slug: string;
  }>;
  wishlistCount: number;
};

export async function getStudentDashboard(userId: string): Promise<StudentDashboard> {
  const [enrollments, resumeProgress, streakRows, certificates, wishlistCount] = await Promise.all([
    db.enrollment.findMany({
      where: { userId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        progressPct: true,
        course: {
          select: {
            id: true,
            slug: true,
            titleAr: true,
            titleEn: true,
            coverImageKey: true,
            status: true,
            totalDurationSec: true,
            instructor: { select: { user: { select: { name: true } } } },
          },
        },
        certificate: { select: { code: true } },
      },
    }),
    db.lessonProgress.findFirst({
      where: {
        enrollment: { userId, status: "ACTIVE" },
        lesson: { section: { course: { status: { in: ["PUBLISHED", "UNLISTED", "ARCHIVED"] } } } },
      },
      orderBy: { updatedAt: "desc" },
      select: {
        lessonId: true,
        lastPositionSec: true,
        lesson: {
          select: {
            titleAr: true,
            titleEn: true,
            type: true,
            section: {
              select: {
                course: {
                  select: {
                    slug: true,
                    titleAr: true,
                    titleEn: true,
                    enrollments: {
                      where: { userId },
                      select: { progressPct: true },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        },
      },
    }),
    db.streakDay.findMany({
      where: { userId },
      orderBy: { day: "desc" },
      take: 400,
      select: { day: true },
    }),
    db.certificate.findMany({
      where: { userId, status: "ISSUED" },
      orderBy: { issuedAt: "desc" },
      take: 6,
      select: {
        code: true,
        course: { select: { slug: true, titleAr: true, titleEn: true } },
      },
    }),
    db.wishlist.count({ where: { userId } }),
  ]);

  const courses: DashboardCourse[] = enrollments.map((enrollment) => ({
    enrollmentId: enrollment.id,
    courseId: enrollment.course.id,
    slug: enrollment.course.slug,
    titleAr: enrollment.course.titleAr,
    titleEn: enrollment.course.titleEn,
    coverImageKey: enrollment.course.coverImageKey,
    status: enrollment.course.status,
    progressPct: enrollment.progressPct,
    totalDurationSec: enrollment.course.totalDurationSec,
    instructorName: enrollment.course.instructor.user.name,
    certificateCode: enrollment.certificate?.code ?? null,
  }));

  const resume: ResumePoint | null =
    resumeProgress === null
      ? null
      : {
          courseSlug: resumeProgress.lesson.section.course.slug,
          courseTitleAr: resumeProgress.lesson.section.course.titleAr,
          courseTitleEn: resumeProgress.lesson.section.course.titleEn,
          lessonId: resumeProgress.lessonId,
          lessonTitleAr: resumeProgress.lesson.titleAr,
          lessonTitleEn: resumeProgress.lesson.titleEn,
          lessonType: resumeProgress.lesson.type,
          positionSec: resumeProgress.lastPositionSec,
          progressPct: resumeProgress.lesson.section.course.enrollments[0]?.progressPct ?? 0,
        };

  const dayKeys = new Set(streakRows.map((row) => riyadhDay(row.day).toISOString().slice(0, 10)));
  const today = riyadhDay(new Date());
  const cursor = new Date(today);
  if (!dayKeys.has(cursor.toISOString().slice(0, 10))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  let current = 0;
  while (dayKeys.has(cursor.toISOString().slice(0, 10))) {
    current += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  let longest = 0;
  let run = 0;
  let previous: number | null = null;
  const ordered = [...dayKeys].sort();
  for (const key of ordered) {
    const value = new Date(`${key}T00:00:00.000Z`).getTime();
    run = previous !== null && value - previous === 86_400_000 ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = value;
  }

  return {
    courses,
    resume,
    streak: { current, longest: Math.max(longest, current) },
    certificates: certificates.map((certificate) => ({
      code: certificate.code,
      courseTitleAr: certificate.course.titleAr,
      courseTitleEn: certificate.course.titleEn,
      slug: certificate.course.slug,
    })),
    wishlistCount,
  };
}
