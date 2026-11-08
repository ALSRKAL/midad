import "server-only";

import { conflict, notFound, unauthorized } from "@/lib/errors";
import { db } from "@/server/db";
import type { SessionUser } from "@/server/session";
import { signedDownloadUrl } from "@/server/storage";

/**
 * Lesson player data and signed assets (P07-T02, BR-20).
 *
 * Access is resolved from the database on every request: a free-preview lesson is public, a paid
 * lesson needs an active enrolment, and the owning instructor or an admin may review it. No object
 * key is ever returned to the client without a short-lived signature.
 */

const PLAYABLE_STATUSES = ["PUBLISHED", "UNLISTED", "ARCHIVED"] as const;

export type PlayerAccessReason = "LOGIN_REQUIRED" | "ENROLLMENT_REQUIRED" | "NOT_FOUND";

export type PlayerLesson = {
  id: string;
  type: "VIDEO" | "TEXT" | "FILE" | "QUIZ";
  titleAr: string;
  titleEn: string;
  durationSec: number;
  isPreview: boolean;
  completed: boolean;
  positionSec: number;
};

export type PlayerSection = {
  id: string;
  titleAr: string;
  titleEn: string;
  lessons: PlayerLesson[];
};

export type PlayerData = {
  course: {
    id: string;
    slug: string;
    titleAr: string | null;
    titleEn: string | null;
    progressPct: number;
    enrollmentId: string | null;
    canViewPaid: boolean;
    isOwner: boolean;
  };
  sections: PlayerSection[];
  current: PlayerLesson & {
    contentAr: string | null;
    contentEn: string | null;
    video: {
      status: string;
      durationSec: number;
      srcUrl: string | null;
      srcType: "application/x-mpegurl" | "video/mp4" | null;
      posterUrl: string | null;
      captionsUrl: string | null;
    } | null;
    attachments: Array<{
      id: string;
      titleAr: string;
      titleEn: string;
      mimeType: string;
      sizeBytes: number;
    }>;
    quizId: string | null;
  };
  prevLessonId: string | null;
  nextLessonId: string | null;
  access: "GRANTED" | PlayerAccessReason;
};

async function resolveCourse(slug: string) {
  return db.course.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      titleAr: true,
      titleEn: true,
      status: true,
      instructor: { select: { userId: true } },
    },
  });
}

export async function canAccessCourse(
  user: SessionUser | null,
  course: { id: string; status: string; instructor: { userId: string } },
): Promise<{ enrolled: boolean; owner: boolean; admin: boolean }> {
  const enrolled =
    user === null
      ? false
      : (
          await db.enrollment.findUnique({
            where: { userId_courseId: { userId: user.id, courseId: course.id } },
            select: { status: true },
          })
        )?.status === "ACTIVE";
  return {
    enrolled,
    owner: user !== null && course.instructor.userId === user.id,
    admin: user?.role === "ADMIN",
  };
}

export async function getPlayerData(
  user: SessionUser | null,
  courseSlug: string,
  lessonId: string,
): Promise<PlayerData | null> {
  const course = await resolveCourse(courseSlug);
  if (course === null) return null;

  const access = await canAccessCourse(user, course);
  const mayViewPaid = access.enrolled || access.owner || access.admin;
  const courseVisible = (PLAYABLE_STATUSES as readonly string[]).includes(course.status);
  if (!courseVisible) return null;

  const enrollment =
    user === null
      ? null
      : await db.enrollment.findUnique({
          where: { userId_courseId: { userId: user.id, courseId: course.id } },
          select: { id: true, progressPct: true, status: true },
        });
  const enrollmentId = enrollment?.status === "ACTIVE" ? enrollment.id : null;

  const sections = await db.section.findMany({
    where: { courseId: course.id },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      titleAr: true,
      titleEn: true,
      lessons: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          type: true,
          titleAr: true,
          titleEn: true,
          durationSec: true,
          isPreview: true,
          contentAr: true,
          contentEn: true,
          videoAsset: {
            select: {
              status: true,
              durationSec: true,
              hlsKey: true,
              originalKey: true,
              thumbnailKey: true,
              captionsKey: true,
            },
          },
          quiz: { select: { id: true } },
          attachments: {
            select: { id: true, titleAr: true, titleEn: true, mimeType: true, sizeBytes: true },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  const progressRows =
    enrollmentId === null
      ? []
      : await db.lessonProgress.findMany({
          where: { enrollmentId },
          select: { lessonId: true, completedAt: true, lastPositionSec: true },
        });
  const progress = new Map(progressRows.map((row) => [row.lessonId, row]));

  const flat = sections.flatMap((section) => section.lessons);
  const currentRow = flat.find((lesson) => lesson.id === lessonId);
  if (currentRow === undefined) return null;

  const allowed = currentRow.isPreview || mayViewPaid;
  const accessState: PlayerData["access"] = allowed
    ? "GRANTED"
    : user === null
      ? "LOGIN_REQUIRED"
      : "ENROLLMENT_REQUIRED";

  const index = flat.findIndex((lesson) => lesson.id === lessonId);
  const lessonView = (lesson: (typeof flat)[number]): PlayerLesson => {
    const row = progress.get(lesson.id);
    return {
      id: lesson.id,
      type: lesson.type,
      titleAr: lesson.titleAr,
      titleEn: lesson.titleEn,
      durationSec: lesson.durationSec,
      isPreview: lesson.isPreview,
      completed: row?.completedAt !== null && row?.completedAt !== undefined,
      positionSec: row?.lastPositionSec ?? 0,
    };
  };

  const hlsKey = currentRow.videoAsset?.hlsKey ?? null;
  const originalKey = currentRow.videoAsset?.originalKey ?? null;
  const [srcUrl, posterUrl, captionsUrl] = await Promise.all([
    allowed && hlsKey !== null
      ? Promise.resolve(`/api/player/hls/${currentRow.id}`)
      : allowed && originalKey !== null
        ? signedDownloadUrl(originalKey)
        : Promise.resolve(null),
    allowed &&
    currentRow.videoAsset?.thumbnailKey !== undefined &&
    currentRow.videoAsset.thumbnailKey !== null
      ? signedDownloadUrl(currentRow.videoAsset.thumbnailKey)
      : Promise.resolve(null),
    allowed &&
    currentRow.videoAsset?.captionsKey !== undefined &&
    currentRow.videoAsset.captionsKey !== null
      ? Promise.resolve(`/api/player/captions/${currentRow.id}`)
      : Promise.resolve(null),
  ]);

  return {
    course: {
      id: course.id,
      slug: course.slug,
      titleAr: course.titleAr,
      titleEn: course.titleEn,
      progressPct: enrollment?.status === "ACTIVE" ? enrollment.progressPct : 0,
      enrollmentId,
      canViewPaid: mayViewPaid,
      isOwner: access.owner,
    },
    sections: sections.map((section) => ({
      id: section.id,
      titleAr: section.titleAr,
      titleEn: section.titleEn,
      lessons: section.lessons.map(lessonView),
    })),
    current: {
      ...lessonView(currentRow),
      contentAr: currentRow.contentAr,
      contentEn: currentRow.contentEn,
      video:
        currentRow.videoAsset === null
          ? null
          : {
              status: currentRow.videoAsset.status,
              durationSec: currentRow.videoAsset.durationSec,
              srcUrl,
              srcType:
                hlsKey !== null
                  ? "application/x-mpegurl"
                  : originalKey !== null
                    ? "video/mp4"
                    : null,
              posterUrl,
              captionsUrl,
            },
      attachments: currentRow.attachments,
      quizId: currentRow.quiz?.id ?? null,
    },
    prevLessonId: index > 0 ? (flat[index - 1]?.id ?? null) : null,
    nextLessonId: index < flat.length - 1 ? (flat[index + 1]?.id ?? null) : null,
    access: accessState,
  };
}

/** VTT captions use a same-origin route so the browser accepts the track without CORS. */
export async function getLessonCaptions(
  user: SessionUser | null,
  lessonId: string,
): Promise<{ captionsKey: string }> {
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: {
      isPreview: true,
      videoAsset: { select: { captionsKey: true } },
      section: {
        select: {
          course: {
            select: { id: true, status: true, instructor: { select: { userId: true } } },
          },
        },
      },
    },
  });
  if (lesson === null) throw notFound("Lesson not found");
  if (lesson.videoAsset?.captionsKey === null || lesson.videoAsset?.captionsKey === undefined) {
    throw notFound("Captions not found");
  }
  const access =
    user === null
      ? { enrolled: false, owner: false, admin: false }
      : await canAccessCourse(user, lesson.section.course);
  if (!lesson.isPreview && !access.enrolled && !access.owner && !access.admin) {
    throw unauthorized();
  }
  return { captionsKey: lesson.videoAsset.captionsKey };
}

export type LessonAssetContext = {
  lessonId: string;
  hlsKey: string;
  captionsKey: string | null;
  durationSec: number;
};

/** Authorises a manifest request; used by the HLS route before rewriting the playlist. */
export async function getPlayableVideo(
  user: SessionUser | null,
  lessonId: string,
): Promise<LessonAssetContext> {
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      isPreview: true,
      videoAsset: {
        select: { status: true, hlsKey: true, captionsKey: true, durationSec: true },
      },
      section: {
        select: {
          course: {
            select: { id: true, status: true, instructor: { select: { userId: true } } },
          },
        },
      },
    },
  });
  if (lesson === null) throw notFound("Lesson not found");
  if (lesson.videoAsset?.status !== "READY" || lesson.videoAsset.hlsKey === null) {
    throw conflict("VIDEO_NOT_READY");
  }
  const canView =
    lesson.isPreview ||
    (user !== null && (await canAccessCourse(user, lesson.section.course)).admin) ||
    (user !== null && (await canAccessCourse(user, lesson.section.course)).enrolled) ||
    (user !== null && (await canAccessCourse(user, lesson.section.course)).owner);
  if (!canView) throw unauthorized();
  return {
    lessonId: lesson.id,
    hlsKey: lesson.videoAsset.hlsKey,
    captionsKey: lesson.videoAsset.captionsKey,
    durationSec: lesson.videoAsset.durationSec,
  };
}

/**
 * Signs a lesson's attachments after the same access check. Preview attachments follow the lesson,
 * so a free preview can hand out its handout without enrolling.
 */
export async function signLessonAttachment(
  user: SessionUser | null,
  attachmentId: string,
): Promise<{ url: string; mimeType: string; title: string }> {
  const attachment = await db.attachment.findUnique({
    where: { id: attachmentId },
    select: {
      fileKey: true,
      mimeType: true,
      titleAr: true,
      lesson: {
        select: {
          isPreview: true,
          section: {
            select: {
              course: {
                select: { id: true, status: true, instructor: { select: { userId: true } } },
              },
            },
          },
        },
      },
    },
  });
  if (attachment === null) throw notFound("Attachment not found");
  const course = attachment.lesson.section.course;
  const access =
    user === null
      ? { enrolled: false, owner: false, admin: false }
      : await canAccessCourse(user, course);
  if (!attachment.lesson.isPreview && !access.enrolled && !access.owner && !access.admin) {
    throw unauthorized();
  }
  return {
    url: await signedDownloadUrl(attachment.fileKey),
    mimeType: attachment.mimeType,
    title: attachment.titleAr,
  };
}
