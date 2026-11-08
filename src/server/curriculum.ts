/**
 * Curriculum writes (P04-T03).
 *
 * Every function resolves the course's instructor and status first: another instructor's ids are a
 * 404, a course under review or in the archive is a conflict, and a reorder request must contain
 * exactly the current ids in a new order — never a partial list, which could silently drop rows.
 */

import "server-only";

import { conflict, notFound } from "@/lib/errors";
import { db } from "@/server/db";

export type BuilderLessonType = "VIDEO" | "TEXT" | "FILE" | "QUIZ";

export type BuilderLesson = {
  id: string;
  type: BuilderLessonType;
  titleAr: string;
  titleEn: string;
  durationSec: number;
  isPreview: boolean;
  isPublished: boolean;
  videoStatus: "UPLOADING" | "PROCESSING" | "READY" | "FAILED" | null;
  quizId: string | null;
};

export type BuilderSection = {
  id: string;
  titleAr: string;
  titleEn: string;
  lessons: BuilderLesson[];
};

async function ownedCourse(instructorId: string, courseId: string): Promise<{ status: string }> {
  const course = await db.course.findFirst({
    where: { id: courseId, instructorId },
    select: { status: true },
  });
  if (course === null) throw notFound("Course not found");
  if (course.status === "PENDING_REVIEW") throw conflict("COURSE_UNDER_REVIEW");
  if (course.status === "ARCHIVED") throw conflict("COURSE_ARCHIVED");
  return course;
}

export type OwnedLesson = {
  id: string;
  type: BuilderLessonType;
  titleAr: string;
  titleEn: string;
  durationSec: number;
  isPreview: boolean;
  sectionId: string;
  sectionTitleAr: string;
  sectionTitleEn: string;
  video: {
    status: "UPLOADING" | "PROCESSING" | "READY" | "FAILED";
    durationSec: number;
    errorMessage: string | null;
  } | null;
  quizId: string | null;
};

export async function getOwnedLesson(
  instructorId: string,
  courseId: string,
  lessonId: string,
): Promise<OwnedLesson | null> {
  const lesson = await db.lesson.findFirst({
    where: { id: lessonId, section: { courseId, course: { instructorId } } },
    select: {
      id: true,
      type: true,
      titleAr: true,
      titleEn: true,
      durationSec: true,
      isPreview: true,
      sectionId: true,
      section: { select: { titleAr: true, titleEn: true } },
      videoAsset: { select: { status: true, durationSec: true, errorMessage: true } },
      quiz: { select: { id: true } },
    },
  });
  if (lesson === null) return null;

  return {
    id: lesson.id,
    type: lesson.type,
    titleAr: lesson.titleAr,
    titleEn: lesson.titleEn,
    durationSec: lesson.durationSec,
    isPreview: lesson.isPreview,
    sectionId: lesson.sectionId,
    sectionTitleAr: lesson.section.titleAr,
    sectionTitleEn: lesson.section.titleEn,
    video: lesson.videoAsset,
    quizId: lesson.quiz?.id ?? null,
  };
}

export async function getCurriculum(
  instructorId: string,
  courseId: string,
): Promise<BuilderSection[]> {
  const course = await db.course.findFirst({
    where: { id: courseId, instructorId },
    select: { id: true },
  });
  if (course === null) throw notFound("Course not found");

  const sections = await db.section.findMany({
    where: { courseId },
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
          isPublished: true,
          videoAsset: { select: { status: true } },
          quiz: { select: { id: true } },
        },
      },
    },
  });

  return sections.map((section) => ({
    id: section.id,
    titleAr: section.titleAr,
    titleEn: section.titleEn,
    lessons: section.lessons.map((lesson) => ({
      id: lesson.id,
      type: lesson.type,
      titleAr: lesson.titleAr,
      titleEn: lesson.titleEn,
      durationSec: lesson.durationSec,
      isPreview: lesson.isPreview,
      isPublished: lesson.isPublished,
      videoStatus: lesson.videoAsset?.status ?? null,
      quizId: lesson.quiz?.id ?? null,
    })),
  }));
}

function requiredTitle(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export async function addSection(
  instructorId: string,
  courseId: string,
  titleAr: string,
  titleEn: string,
): Promise<{ id: string }> {
  await ownedCourse(instructorId, courseId);
  if (requiredTitle(titleAr) === null && requiredTitle(titleEn) === null) {
    throw conflict("SECTION_TITLE_REQUIRED");
  }

  const last = await db.section.findFirst({
    where: { courseId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  return db.section.create({
    data: {
      courseId,
      titleAr: requiredTitle(titleAr) ?? titleEn,
      titleEn: requiredTitle(titleEn) ?? titleAr,
      sortOrder: (last?.sortOrder ?? -1) + 1,
    },
    select: { id: true },
  });
}

export async function renameSection(
  instructorId: string,
  courseId: string,
  sectionId: string,
  titleAr: string,
  titleEn: string,
): Promise<void> {
  await ownedCourse(instructorId, courseId);
  if (requiredTitle(titleAr) === null && requiredTitle(titleEn) === null) {
    throw conflict("SECTION_TITLE_REQUIRED");
  }

  const updated = await db.section.updateMany({
    where: { id: sectionId, courseId },
    data: {
      titleAr: requiredTitle(titleAr) ?? titleEn,
      titleEn: requiredTitle(titleEn) ?? titleAr,
    },
  });
  if (updated.count === 0) throw notFound("Section not found");
}

export async function deleteSection(
  instructorId: string,
  courseId: string,
  sectionId: string,
): Promise<void> {
  await ownedCourse(instructorId, courseId);
  const deleted = await db.section.deleteMany({ where: { id: sectionId, courseId } });
  if (deleted.count === 0) throw notFound("Section not found");
}

export async function addLesson(
  instructorId: string,
  courseId: string,
  sectionId: string,
  type: BuilderLessonType,
  titleAr: string,
  titleEn: string,
): Promise<{ id: string }> {
  await ownedCourse(instructorId, courseId);
  if (requiredTitle(titleAr) === null && requiredTitle(titleEn) === null) {
    throw conflict("LESSON_TITLE_REQUIRED");
  }

  const section = await db.section.findFirst({
    where: { id: sectionId, courseId },
    select: { id: true },
  });
  if (section === null) throw notFound("Section not found");

  const last = await db.lesson.findFirst({
    where: { sectionId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const resolvedAr = requiredTitle(titleAr) ?? titleEn;
  const resolvedEn = requiredTitle(titleEn) ?? titleAr;

  return db.lesson.create({
    data: {
      sectionId,
      type,
      titleAr: resolvedAr,
      titleEn: resolvedEn,
      sortOrder: (last?.sortOrder ?? -1) + 1,
      // A quiz lesson without a quiz row has nothing to edit or take; create its shell now.
      ...(type === "QUIZ"
        ? {
            quiz: {
              create: {
                titleAr: resolvedAr,
                titleEn: resolvedEn,
              },
            },
          }
        : {}),
    },
    select: { id: true },
  });
}

export async function renameLesson(
  instructorId: string,
  courseId: string,
  lessonId: string,
  titleAr: string,
  titleEn: string,
): Promise<void> {
  await ownedCourse(instructorId, courseId);
  if (requiredTitle(titleAr) === null && requiredTitle(titleEn) === null) {
    throw conflict("LESSON_TITLE_REQUIRED");
  }

  const lesson = await db.lesson.findFirst({
    where: { id: lessonId, section: { courseId } },
    select: { id: true },
  });
  if (lesson === null) throw notFound("Lesson not found");

  await db.lesson.update({
    where: { id: lessonId },
    data: {
      titleAr: requiredTitle(titleAr) ?? titleEn,
      titleEn: requiredTitle(titleEn) ?? titleAr,
    },
  });
}

export async function deleteLesson(
  instructorId: string,
  courseId: string,
  lessonId: string,
): Promise<void> {
  await ownedCourse(instructorId, courseId);
  const deleted = await db.lesson.deleteMany({
    where: { id: lessonId, section: { courseId } },
  });
  if (deleted.count === 0) throw notFound("Lesson not found");
}

export async function reorderSections(
  instructorId: string,
  courseId: string,
  orderedIds: string[],
): Promise<void> {
  await ownedCourse(instructorId, courseId);
  const current = await db.section.findMany({ where: { courseId }, select: { id: true } });
  const currentIds = new Set(current.map((row) => row.id));
  if (
    orderedIds.length !== currentIds.size ||
    orderedIds.some((id) => !currentIds.has(id)) ||
    new Set(orderedIds).size !== orderedIds.length
  ) {
    throw conflict("ORDER_MISMATCH");
  }

  await db.$transaction(
    orderedIds.map((id, index) => db.section.update({ where: { id }, data: { sortOrder: index } })),
  );
}

export async function reorderLessons(
  instructorId: string,
  courseId: string,
  sectionId: string,
  orderedIds: string[],
): Promise<void> {
  await ownedCourse(instructorId, courseId);
  const section = await db.section.findFirst({
    where: { id: sectionId, courseId },
    select: { id: true },
  });
  if (section === null) throw notFound("Section not found");

  const current = await db.lesson.findMany({
    where: { sectionId },
    select: { id: true },
  });
  const currentIds = new Set(current.map((row) => row.id));
  if (
    orderedIds.length !== currentIds.size ||
    orderedIds.some((id) => !currentIds.has(id)) ||
    new Set(orderedIds).size !== orderedIds.length
  ) {
    throw conflict("ORDER_MISMATCH");
  }

  await db.$transaction(
    orderedIds.map((id, index) => db.lesson.update({ where: { id }, data: { sortOrder: index } })),
  );
}

/** Toggles the free-preview marker. Only affects what the public page marks, not access (P07). */
export async function setLessonPreview(
  instructorId: string,
  courseId: string,
  lessonId: string,
  isPreview: boolean,
): Promise<void> {
  await ownedCourse(instructorId, courseId);
  const updated = await db.lesson.updateMany({
    where: { id: lessonId, section: { courseId } },
    data: { isPreview },
  });
  if (updated.count === 0) throw notFound("Lesson not found");
}

/** Moves a lesson to the end of another section of the same course. */
export async function moveLesson(
  instructorId: string,
  courseId: string,
  lessonId: string,
  targetSectionId: string,
): Promise<void> {
  await ownedCourse(instructorId, courseId);
  const target = await db.section.findFirst({
    where: { id: targetSectionId, courseId },
    select: { id: true },
  });
  if (target === null) throw notFound("Section not found");

  const lesson = await db.lesson.findFirst({
    where: { id: lessonId, section: { courseId } },
    select: { id: true, sectionId: true },
  });
  if (lesson === null) throw notFound("Lesson not found");
  if (lesson.sectionId === targetSectionId) return;

  const last = await db.lesson.findFirst({
    where: { sectionId: targetSectionId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  await db.lesson.update({
    where: { id: lessonId },
    data: { sectionId: targetSectionId, sortOrder: (last?.sortOrder ?? -1) + 1 },
  });
}
