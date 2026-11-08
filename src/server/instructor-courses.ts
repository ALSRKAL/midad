/**
 * Instructor-owned course data (the product requirements).
 *
 * Every query starts from the signed-in instructor's profile id, and `getOwnedCourse` filters by
 * `instructorId` itself: another instructor's course id is a 404, not a 403, so ids cannot be
 * enumerated. Admin accounts without an instructor profile get null rather than every course.
 */

import "server-only";

import { randomUUID } from "node:crypto";

import { conflict, notFound, validationFailed } from "@/lib/errors";
import { detectImageType } from "@/lib/image-signature";
import { normalizeBilingual } from "@/lib/search-normalize";
import { db } from "@/server/db";
import { logger } from "@/server/logger";
import { storage } from "@/server/storage";

export async function getInstructorProfileId(userId: string): Promise<string | null> {
  const profile = await db.instructorProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  return profile?.id ?? null;
}

export type InstructorCourseListItem = {
  id: string;
  slug: string;
  titleAr: string | null;
  titleEn: string | null;
  status: "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "REJECTED" | "UNLISTED" | "ARCHIVED";
  priceCents: number;
  isFree: boolean;
  currency: string;
  studentsCount: number;
  ratingAvg: number;
  ratingCount: number;
  lessonCount: number;
  coverImageKey: string | null;
  rejectionReason: string | null;
  updatedAt: Date;
};

export async function listInstructorCourses(
  instructorId: string,
): Promise<InstructorCourseListItem[]> {
  const rows = await db.course.findMany({
    where: { instructorId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      slug: true,
      titleAr: true,
      titleEn: true,
      status: true,
      priceCents: true,
      isFree: true,
      currency: true,
      studentsCount: true,
      ratingAvg: true,
      ratingCount: true,
      coverImageKey: true,
      rejectionReason: true,
      updatedAt: true,
      sections: { select: { _count: { select: { lessons: true } } } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    titleAr: row.titleAr,
    titleEn: row.titleEn,
    status: row.status,
    priceCents: row.priceCents,
    isFree: row.isFree,
    currency: row.currency,
    studentsCount: row.studentsCount,
    ratingAvg: row.ratingAvg,
    ratingCount: row.ratingCount,
    lessonCount: row.sections.reduce((sum, section) => sum + section._count.lessons, 0),
    coverImageKey: row.coverImageKey,
    rejectionReason: row.rejectionReason,
    updatedAt: row.updatedAt,
  }));
}

export type InstructorStats = {
  totalCourses: number;
  publishedCourses: number;
  pendingCourses: number;
  totalStudents: number;
  averageRating: number;
};

export async function getInstructorStats(instructorId: string): Promise<InstructorStats> {
  const [totalCourses, publishedCourses, pendingCourses, students, ratings] = await Promise.all([
    db.course.count({ where: { instructorId } }),
    db.course.count({ where: { instructorId, status: "PUBLISHED" } }),
    db.course.count({ where: { instructorId, status: "PENDING_REVIEW" } }),
    db.course.aggregate({
      where: { instructorId },
      _sum: { studentsCount: true },
    }),
    db.review.aggregate({
      where: { course: { instructorId }, isHidden: false },
      _avg: { rating: true },
    }),
  ]);

  return {
    totalCourses,
    publishedCourses,
    pendingCourses,
    totalStudents: students._sum.studentsCount ?? 0,
    // The review average is taken over actual reviews; averaging course columns would let unrated
    // courses pull the instructor's rating toward zero.
    averageRating: Math.round((ratings._avg.rating ?? 0) * 100),
  };
}

export async function createCourseDraft(instructorId: string): Promise<{ id: string }> {
  const category = await db.category.findFirst({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true },
  });
  if (category === null) {
    throw conflict("NO_CATEGORY");
  }

  return db.course.create({
    data: {
      instructorId,
      categoryId: category.id,
      // A stable, private-looking slug until the instructor names the course; the public route
      // never lists a draft, so a placeholder slug cannot leak into search.
      slug: `draft-${randomUUID().slice(0, 8)}`,
      status: "DRAFT",
      currency: "SAR",
    },
    select: { id: true },
  });
}

export type InstructorCourseBasics = {
  id: string;
  slug: string;
  status: "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "REJECTED" | "UNLISTED" | "ARCHIVED";
  rejectionReason: string | null;
  titleAr: string | null;
  titleEn: string | null;
  subtitleAr: string | null;
  subtitleEn: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
  categoryId: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL_LEVELS";
  language: "AR" | "EN";
  coverImageKey: string | null;
  priceCents: number;
  isFree: boolean;
  updatedAt: Date;
  sectionCount: number;
  lessonCount: number;
};

export async function findOwnedCourse(
  instructorId: string,
  courseId: string,
): Promise<InstructorCourseBasics | null> {
  const course = await db.course.findFirst({
    where: { id: courseId, instructorId },
    select: {
      id: true,
      slug: true,
      status: true,
      rejectionReason: true,
      titleAr: true,
      titleEn: true,
      subtitleAr: true,
      subtitleEn: true,
      descriptionAr: true,
      descriptionEn: true,
      categoryId: true,
      level: true,
      language: true,
      coverImageKey: true,
      priceCents: true,
      isFree: true,
      updatedAt: true,
      sections: {
        select: { _count: { select: { lessons: true } } },
      },
    },
  });
  if (course === null) return null;

  return {
    id: course.id,
    slug: course.slug,
    status: course.status,
    rejectionReason: course.rejectionReason,
    titleAr: course.titleAr,
    titleEn: course.titleEn,
    subtitleAr: course.subtitleAr,
    subtitleEn: course.subtitleEn,
    descriptionAr: course.descriptionAr,
    descriptionEn: course.descriptionEn,
    categoryId: course.categoryId,
    level: course.level,
    language: course.language,
    coverImageKey: course.coverImageKey,
    priceCents: course.priceCents,
    isFree: course.isFree,
    updatedAt: course.updatedAt,
    sectionCount: course.sections.length,
    lessonCount: course.sections.reduce((sum, section) => sum + section._count.lessons, 0),
  };
}

/** Throwing variant for actions; pages use `findOwnedCourse` and call Next's notFound. */
export async function getOwnedCourse(
  instructorId: string,
  courseId: string,
): Promise<InstructorCourseBasics> {
  const course = await findOwnedCourse(instructorId, courseId);
  if (course === null) throw notFound("Course not found");
  return course;
}

/** Throws NOT_FOUND unless the course belongs to this instructor. Used by every write action. */
export async function assertCourseOwnership(instructorId: string, courseId: string): Promise<void> {
  const course = await db.course.findFirst({
    where: { id: courseId, instructorId },
    select: { id: true },
  });
  if (course === null) throw notFound("Course not found");
}

export type CourseBasicsUpdate = {
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  categoryId: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL_LEVELS";
  language: "AR" | "EN";
};

function nullIfEmpty(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * Autosaved basics (P04-T02).
 *
 * A published course may still be edited (BR-03), but a title change is written to the audit log in
 * the same transaction so the admin can see what changed and when.
 */
export async function updateCourseBasics(
  instructorId: string,
  actorId: string,
  courseId: string,
  input: CourseBasicsUpdate,
): Promise<{ updatedAt: Date }> {
  const current = await db.course.findFirst({
    where: { id: courseId, instructorId },
    select: { id: true, status: true, titleAr: true, titleEn: true },
  });
  if (current === null) throw notFound("Course not found");

  const category = await db.category.findFirst({
    where: { id: input.categoryId, isActive: true },
    select: { id: true },
  });
  if (category === null) throw notFound("Category not found");

  const data = {
    titleAr: nullIfEmpty(input.titleAr),
    titleEn: nullIfEmpty(input.titleEn),
    subtitleAr: nullIfEmpty(input.subtitleAr),
    subtitleEn: nullIfEmpty(input.subtitleEn),
    descriptionAr: nullIfEmpty(input.descriptionAr),
    descriptionEn: nullIfEmpty(input.descriptionEn),
    categoryId: input.categoryId,
    level: input.level,
    language: input.language,
    // Search columns are maintained with the same folding as the seed (the product requirements).
    titleNormalized: normalizeBilingual(input.titleAr, input.titleEn),
    descriptionNormalized: normalizeBilingual(
      input.subtitleAr,
      input.descriptionAr,
      input.subtitleEn,
      input.descriptionEn,
    ),
  };

  const titleChanged = current.titleAr !== data.titleAr || current.titleEn !== data.titleEn;
  const shouldAudit = current.status === "PUBLISHED" && titleChanged;

  const [updated] = await db.$transaction([
    db.course.update({ where: { id: courseId }, data, select: { updatedAt: true } }),
    ...(shouldAudit
      ? [
          db.auditLog.create({
            data: {
              actorId,
              action: "course.titleUpdated",
              entity: "Course",
              entityId: courseId,
              before: { titleAr: current.titleAr, titleEn: current.titleEn },
              after: { titleAr: data.titleAr, titleEn: data.titleEn },
            },
          }),
        ]
      : []),
  ]);

  return { updatedAt: updated.updatedAt };
}

export type CourseObjectiveRow = { id: string; textAr: string; textEn: string };

export async function getCourseObjectives(
  instructorId: string,
  courseId: string,
): Promise<CourseObjectiveRow[]> {
  const course = await db.course.findFirst({
    where: { id: courseId, instructorId },
    select: {
      objectives: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, textAr: true, textEn: true },
      },
    },
  });
  if (course === null) throw notFound("Course not found");
  return course.objectives;
}

/** Replaces the whole list in one transaction; empty rows are dropped before storage. */
export async function replaceCourseObjectives(
  instructorId: string,
  courseId: string,
  objectives: Array<{ textAr: string; textEn: string }>,
): Promise<void> {
  await assertCourseOwnership(instructorId, courseId);
  const rows = objectives
    .map((objective) => ({
      textAr: objective.textAr.trim(),
      textEn: objective.textEn.trim(),
    }))
    .filter((objective) => objective.textAr !== "" || objective.textEn !== "");

  await db.$transaction([
    db.courseObjective.deleteMany({ where: { courseId } }),
    db.courseObjective.createMany({
      data: rows.map((objective, index) => ({
        courseId,
        textAr: objective.textAr === "" ? objective.textEn : objective.textAr,
        textEn: objective.textEn === "" ? objective.textAr : objective.textEn,
        sortOrder: index,
      })),
    }),
  ]);
}

export type CourseCoverResult = { coverImageKey: string; coverUrl: string };
/**
 * Course cover upload (P04-T02).
 *
 * Server-side upload with magic-byte validation, exactly like avatars: the declared MIME type is a
 * claim. Old objects are deleted best-effort so replacing a cover does not leak storage.
 */
export async function uploadCourseCover(
  instructorId: string,
  courseId: string,
  file: File,
): Promise<CourseCoverResult> {
  if (file.size === 0) throw validationFailed({ cover: ["COVER_EMPTY"] });
  if (file.size > 5 * 1024 * 1024) throw validationFailed({ cover: ["COVER_TOO_LARGE"] });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = detectImageType(bytes);
  if (detected === null) throw validationFailed({ cover: ["COVER_UNSUPPORTED"] });

  const course = await db.course.findFirst({
    where: { id: courseId, instructorId },
    select: { coverImageKey: true },
  });
  if (course === null) throw notFound("Course not found");

  const key = `covers/${courseId}/${randomUUID()}.${detected.extension}`;
  await storage.putObject({
    bucket: "public",
    key,
    body: bytes,
    contentType: detected.mime,
    cacheControl: "public, max-age=31536000, immutable",
  });

  await db.course.update({ where: { id: courseId }, data: { coverImageKey: key } });

  if (course.coverImageKey !== null) {
    await storage.deleteObject("public", course.coverImageKey).catch((error: unknown) => {
      logger.warn({ err: error, key: course.coverImageKey }, "could not delete replaced cover");
    });
  }

  return { coverImageKey: key, coverUrl: storage.publicUrl(key) };
}
