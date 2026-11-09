/** Validation for the course builder (P04-T02). Codes are translated by the client. */

import { z } from "zod";

export const courseBasicsSchema = z.object({
  courseId: z.string().min(1, { message: "COURSE_REQUIRED" }),
  titleAr: z.string().trim().max(160, { message: "TITLE_TOO_LONG" }),
  titleEn: z.string().trim().max(160, { message: "TITLE_TOO_LONG" }),
  subtitleAr: z.string().trim().max(200, { message: "SUBTITLE_TOO_LONG" }),
  subtitleEn: z.string().trim().max(200, { message: "SUBTITLE_TOO_LONG" }),
  descriptionAr: z.string().trim().max(5000, { message: "DESCRIPTION_TOO_LONG" }),
  descriptionEn: z.string().trim().max(5000, { message: "DESCRIPTION_TOO_LONG" }),
  categoryId: z.string().min(1, { message: "CATEGORY_REQUIRED" }),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "ALL_LEVELS"], {
    message: "LEVEL_INVALID",
  }),
  language: z.enum(["AR", "EN"], { message: "LANGUAGE_INVALID" }),
});

export type CourseBasicsInput = z.infer<typeof courseBasicsSchema>;

export const courseCoverSchema = z.object({
  courseId: z.string().min(1, { message: "COURSE_REQUIRED" }),
  cover: z.instanceof(File, { message: "COVER_REQUIRED" }),
});

const title = z.string().trim().max(120, { message: "TITLE_TOO_LONG" });
const id = z.string().min(1, { message: "ID_REQUIRED" });
export const LESSON_TYPES = ["VIDEO", "TEXT", "FILE", "QUIZ"] as const;

export const sectionCreateSchema = z.object({
  courseId: id,
  titleAr: title,
  titleEn: title,
});

export const sectionRenameSchema = z.object({
  courseId: id,
  sectionId: id,
  titleAr: title,
  titleEn: title,
});

export const sectionDeleteSchema = z.object({
  courseId: id,
  sectionId: id,
});

export const lessonCreateSchema = z.object({
  courseId: id,
  sectionId: id,
  type: z.enum(LESSON_TYPES, { message: "LESSON_TYPE_INVALID" }),
  titleAr: title,
  titleEn: title,
});

export const lessonRenameSchema = z.object({
  courseId: id,
  lessonId: id,
  titleAr: title,
  titleEn: title,
});

export const lessonDeleteSchema = z.object({
  courseId: id,
  lessonId: id,
});

export const sectionReorderSchema = z.object({
  courseId: id,
  orderedIds: z.array(id).min(1, { message: "ORDER_EMPTY" }).max(200),
});

export const lessonReorderSchema = z.object({
  courseId: id,
  sectionId: id,
  orderedIds: z.array(id).min(1, { message: "ORDER_EMPTY" }).max(500),
});

export const lessonMoveSchema = z.object({
  courseId: id,
  lessonId: id,
  targetSectionId: id,
});

export const lessonPreviewSchema = z.object({
  courseId: id,
  lessonId: id,
  isPreview: z.boolean(),
});
