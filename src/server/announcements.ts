import "server-only";

import { env } from "@/env";
import { forbidden, notFound, validationFailed } from "@/lib/errors";
import { db } from "@/server/db";
import type { SessionUser } from "@/server/session";

/**
 * Instructor announcements (P09-T04).
 *
 * Only the course's own instructor (or an admin) may post. The announcement, every in-app
 * notification and the queued email rows are written in one transaction, so no learner sees an
 * announcement that failed halfway.
 */

export async function listInstructorAnnouncements(user: SessionUser) {
  return db.announcement.findMany({
    where: user.role === "ADMIN" ? {} : { course: { instructor: { userId: user.id } } },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      body: true,
      createdAt: true,
      course: { select: { slug: true, titleAr: true, titleEn: true } },
      author: { select: { name: true } },
    },
  });
}

export async function createAnnouncement(input: {
  user: SessionUser;
  courseId: string;
  title: string;
  body: string;
}): Promise<{ id: string }> {
  const title = input.title.trim();
  const body = input.body.trim();
  if (title.length < 3) throw validationFailed({ title: ["TITLE_TOO_SHORT"] });
  if (body.length < 10) throw validationFailed({ body: ["BODY_TOO_SHORT"] });

  const course = await db.course.findUnique({
    where: { id: input.courseId },
    select: {
      id: true,
      slug: true,
      titleAr: true,
      titleEn: true,
      status: true,
      instructor: { select: { userId: true } },
      enrollments: {
        where: { status: "ACTIVE" },
        select: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              locale: true,
              notifyAnnouncements: true,
            },
          },
        },
      },
    },
  });
  if (course === null) throw notFound("Course not found");
  if (course.instructor.userId !== input.user.id && input.user.role !== "ADMIN") {
    throw forbidden("ONLY_COURSE_INSTRUCTOR_CAN_ANNOUNCE");
  }
  if (course.status !== "PUBLISHED" && course.status !== "UNLISTED") {
    throw forbidden("COURSE_NOT_AVAILABLE");
  }

  const linkPath = `/courses/${course.slug}`;
  const announcement = await db.$transaction(async (tx) => {
    const created = await tx.announcement.create({
      data: {
        courseId: course.id,
        authorId: input.user.id,
        title,
        body,
      },
      select: { id: true },
    });
    if (course.enrollments.length > 0) {
      await tx.notification.createMany({
        data: course.enrollments.map(({ user }) => ({
          userId: user.id,
          type: "ANNOUNCEMENT" as const,
          title,
          body,
          linkPath,
          data: { titleEn: title, bodyEn: body },
        })),
      });
    }
    const recipients = course.enrollments.filter(({ user }) => user.notifyAnnouncements);
    if (recipients.length > 0) {
      await tx.emailJob.createMany({
        data: recipients.map(({ user }) => ({
          to: user.email,
          template: "announcement",
          locale: user.locale === "EN" ? "en" : "ar",
          data: {
            name: user.name,
            title,
            body,
            courseTitle:
              user.locale === "EN"
                ? (course.titleEn ?? course.titleAr ?? "")
                : (course.titleAr ?? course.titleEn ?? ""),
            url: `${env.APP_URL}/${user.locale === "EN" ? "en" : "ar"}${linkPath}`,
          },
        })),
      });
    }
    return created;
  });

  return announcement;
}
