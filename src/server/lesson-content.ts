/**
 * Lesson content: rich text, attachments and quizzes (P04-T05).
 *
 * All writes re-resolve ownership from the sign-in and refuse a course under review or in the
 * archive. Rich text is sanitised before storage, quiz correctness stays server-side, and attachment
 * files land in the private bucket with a short-lived signed download.
 */

import "server-only";

import { randomUUID } from "node:crypto";

import { conflict, notFound, validationFailed } from "@/lib/errors";
import { sanitizeRichText } from "@/lib/sanitize-rich-text";
import { db } from "@/server/db";
import { logger } from "@/server/logger";
import { storage } from "@/server/storage";

type LessonType = "VIDEO" | "TEXT" | "FILE" | "QUIZ";

async function ownedLesson(
  instructorId: string,
  courseId: string,
  lessonId: string,
  expected?: LessonType,
): Promise<{ id: string; type: LessonType }> {
  const lesson = await db.lesson.findFirst({
    where: { id: lessonId, section: { courseId, course: { instructorId } } },
    select: {
      id: true,
      type: true,
      section: { select: { course: { select: { status: true } } } },
    },
  });
  if (lesson === null) throw notFound("Lesson not found");
  if (expected !== undefined && lesson.type !== expected) throw conflict("LESSON_TYPE_MISMATCH");
  if (lesson.section.course.status === "PENDING_REVIEW") throw conflict("COURSE_UNDER_REVIEW");
  if (lesson.section.course.status === "ARCHIVED") throw conflict("COURSE_ARCHIVED");
  return { id: lesson.id, type: lesson.type };
}

/* -------------------------------------------------------------------------- */
/* Rich text                                                                   */
/* -------------------------------------------------------------------------- */

export async function updateLessonText(
  instructorId: string,
  courseId: string,
  lessonId: string,
  contentAr: string,
  contentEn: string,
): Promise<void> {
  await ownedLesson(instructorId, courseId, lessonId, "TEXT");
  await db.lesson.update({
    where: { id: lessonId },
    data: {
      contentAr: sanitizeRichText(contentAr),
      contentEn: sanitizeRichText(contentEn),
    },
  });
}

export async function getLessonText(
  instructorId: string,
  courseId: string,
  lessonId: string,
): Promise<{ contentAr: string; contentEn: string }> {
  const lesson = await db.lesson.findFirst({
    where: {
      id: lessonId,
      type: "TEXT",
      section: { courseId, course: { instructorId } },
    },
    select: { contentAr: true, contentEn: true },
  });
  if (lesson === null) throw notFound("Lesson not found");
  return { contentAr: lesson.contentAr ?? "", contentEn: lesson.contentEn ?? "" };
}

/* -------------------------------------------------------------------------- */
/* Attachments                                                                 */
/* -------------------------------------------------------------------------- */

const ATTACHMENT_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
  "application/zip": "zip",
};
export const ATTACHMENT_MAX_BYTES = 20 * 1024 * 1024;

export type AttachmentRow = {
  id: string;
  title: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
};

export async function listAttachments(
  instructorId: string,
  courseId: string,
  lessonId: string,
): Promise<AttachmentRow[]> {
  await ownedLesson(instructorId, courseId, lessonId);
  const rows = await db.attachment.findMany({
    where: { lessonId },
    orderBy: { createdAt: "asc" },
    select: { id: true, titleAr: true, mimeType: true, sizeBytes: true, createdAt: true },
  });
  return rows.map((row) => ({
    id: row.id,
    title: row.titleAr,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    createdAt: row.createdAt,
  }));
}

export async function addAttachment(
  instructorId: string,
  courseId: string,
  lessonId: string,
  file: File,
): Promise<AttachmentRow> {
  await ownedLesson(instructorId, courseId, lessonId);
  if (file.size === 0) throw validationFailed({ file: ["ATTACHMENT_EMPTY"] });
  if (file.size > ATTACHMENT_MAX_BYTES) throw validationFailed({ file: ["ATTACHMENT_TOO_LARGE"] });

  const extension = ATTACHMENT_TYPES[file.type];
  if (extension === undefined) throw validationFailed({ file: ["ATTACHMENT_TYPE_INVALID"] });

  const title = file.name.replace(/[\\/]/g, "").slice(0, 200);
  const key = `attachments/${lessonId}/${randomUUID()}.${extension}`;
  await storage.putObject({
    bucket: "private",
    key,
    body: new Uint8Array(await file.arrayBuffer()),
    contentType: file.type,
    cacheControl: "private, max-age=31536000, immutable",
  });

  const created = await db.attachment.create({
    data: {
      lessonId,
      titleAr: title,
      titleEn: title,
      fileKey: key,
      mimeType: file.type,
      sizeBytes: file.size,
    },
    select: { id: true, titleAr: true, mimeType: true, sizeBytes: true, createdAt: true },
  });

  return {
    id: created.id,
    title: created.titleAr,
    mimeType: created.mimeType,
    sizeBytes: created.sizeBytes,
    createdAt: created.createdAt,
  };
}

export async function deleteAttachment(instructorId: string, attachmentId: string): Promise<void> {
  const attachment = await db.attachment.findFirst({
    where: {
      id: attachmentId,
      lesson: { section: { course: { instructorId } } },
    },
    select: { id: true, fileKey: true },
  });
  if (attachment === null) throw notFound("Attachment not found");

  await db.attachment.delete({ where: { id: attachment.id } });
  await storage.deleteObject("private", attachment.fileKey).catch((error: unknown) => {
    logger.warn({ err: error, key: attachment.fileKey }, "could not delete attachment object");
  });
}

export async function findAttachmentForDownload(
  instructorId: string,
  attachmentId: string,
): Promise<{ fileKey: string; title: string; mimeType: string } | null> {
  const attachment = await db.attachment.findFirst({
    where: {
      id: attachmentId,
      lesson: { section: { course: { instructorId } } },
    },
    select: { fileKey: true, titleAr: true, mimeType: true },
  });
  if (attachment === null) return null;
  return { fileKey: attachment.fileKey, title: attachment.titleAr, mimeType: attachment.mimeType };
}

/* -------------------------------------------------------------------------- */
/* Quiz                                                                        */
/* -------------------------------------------------------------------------- */

export type QuestionType = "SINGLE_CHOICE" | "MULTI_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";

export type BuilderOption = { id: string; textAr: string; textEn: string; isCorrect: boolean };
export type BuilderQuestion = {
  id: string;
  type: QuestionType;
  promptAr: string;
  promptEn: string;
  explanationAr: string;
  explanationEn: string;
  points: number;
  acceptedAnswers: string[];
  options: BuilderOption[];
};

export type BuilderQuiz = {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  passPct: number;
  maxAttempts: number;
  timeLimitSec: number | null;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  questions: BuilderQuestion[];
};

function acceptedAnswers(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export async function getLessonQuiz(
  instructorId: string,
  courseId: string,
  lessonId: string,
): Promise<BuilderQuiz | null> {
  await ownedLesson(instructorId, courseId, lessonId, "QUIZ");
  const quiz = await db.quiz.findUnique({
    where: { lessonId },
    select: {
      id: true,
      titleAr: true,
      titleEn: true,
      descriptionAr: true,
      descriptionEn: true,
      passPct: true,
      maxAttempts: true,
      timeLimitSec: true,
      shuffleQuestions: true,
      shuffleOptions: true,
      questions: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          type: true,
          promptAr: true,
          promptEn: true,
          explanationAr: true,
          explanationEn: true,
          points: true,
          acceptedAnswers: true,
          options: {
            orderBy: { sortOrder: "asc" },
            select: { id: true, textAr: true, textEn: true, isCorrect: true },
          },
        },
      },
    },
  });
  if (quiz === null) return null;

  return {
    ...quiz,
    descriptionAr: quiz.descriptionAr ?? "",
    descriptionEn: quiz.descriptionEn ?? "",
    questions: quiz.questions.map((question) => ({
      ...question,
      explanationAr: question.explanationAr ?? "",
      explanationEn: question.explanationEn ?? "",
      acceptedAnswers: acceptedAnswers(question.acceptedAnswers),
    })),
  };
}

export async function updateQuizSettings(
  instructorId: string,
  courseId: string,
  lessonId: string,
  input: {
    titleAr: string;
    titleEn: string;
    descriptionAr: string;
    descriptionEn: string;
    passPct: number;
    maxAttempts: number;
    timeLimitSec: number | null;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
  },
): Promise<void> {
  await ownedLesson(instructorId, courseId, lessonId, "QUIZ");
  const quiz = await db.quiz.findUnique({ where: { lessonId }, select: { id: true } });
  if (quiz === null) throw notFound("Quiz not found");

  await db.quiz.update({
    where: { id: quiz.id },
    data: {
      titleAr: input.titleAr.trim() === "" ? input.titleEn : input.titleAr,
      titleEn: input.titleEn.trim() === "" ? input.titleAr : input.titleEn,
      descriptionAr: input.descriptionAr.trim() === "" ? null : input.descriptionAr,
      descriptionEn: input.descriptionEn.trim() === "" ? null : input.descriptionEn,
      passPct: input.passPct,
      maxAttempts: input.maxAttempts,
      timeLimitSec: input.timeLimitSec,
      shuffleQuestions: input.shuffleQuestions,
      shuffleOptions: input.shuffleOptions,
    },
  });
}

export async function addQuestion(
  instructorId: string,
  courseId: string,
  lessonId: string,
  type: QuestionType,
): Promise<{ id: string }> {
  await ownedLesson(instructorId, courseId, lessonId, "QUIZ");
  const quiz = await db.quiz.findUnique({ where: { lessonId }, select: { id: true } });
  if (quiz === null) throw notFound("Quiz not found");

  const last = await db.question.findFirst({
    where: { quizId: quiz.id },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const isChoice = type === "SINGLE_CHOICE" || type === "MULTI_CHOICE" || type === "TRUE_FALSE";
  const options =
    type === "TRUE_FALSE"
      ? [
          { textAr: "صح", textEn: "True", isCorrect: true, sortOrder: 0 },
          { textAr: "خطأ", textEn: "False", isCorrect: false, sortOrder: 1 },
        ]
      : isChoice
        ? [
            { textAr: "", textEn: "", isCorrect: true, sortOrder: 0 },
            { textAr: "", textEn: "", isCorrect: false, sortOrder: 1 },
          ]
        : [];

  return db.question.create({
    data: {
      quizId: quiz.id,
      type,
      promptAr: "",
      promptEn: "",
      sortOrder: (last?.sortOrder ?? -1) + 1,
      ...(options.length === 0 ? {} : { options: { create: options } }),
    },
    select: { id: true },
  });
}

export type QuestionSaveInput = {
  promptAr: string;
  promptEn: string;
  explanationAr: string;
  explanationEn: string;
  points: number;
  acceptedAnswers: string[];
  options: Array<{ textAr: string; textEn: string; isCorrect: boolean }>;
};

export async function saveQuestion(
  instructorId: string,
  courseId: string,
  lessonId: string,
  questionId: string,
  input: QuestionSaveInput,
): Promise<void> {
  await ownedLesson(instructorId, courseId, lessonId, "QUIZ");
  const question = await db.question.findFirst({
    where: { id: questionId, quiz: { lessonId } },
    select: { id: true, type: true, quizId: true },
  });
  if (question === null) throw notFound("Question not found");

  if (input.promptAr.trim() === "" && input.promptEn.trim() === "") {
    throw validationFailed({ prompt: ["PROMPT_REQUIRED"] });
  }

  const isChoice =
    question.type === "SINGLE_CHOICE" ||
    question.type === "MULTI_CHOICE" ||
    question.type === "TRUE_FALSE";

  if (isChoice) {
    if (input.options.length < 2) throw validationFailed({ options: ["OPTIONS_REQUIRED"] });
    if (!input.options.some((option) => option.isCorrect)) {
      throw validationFailed({ options: ["CORRECT_REQUIRED"] });
    }
    if (
      (question.type === "SINGLE_CHOICE" || question.type === "TRUE_FALSE") &&
      input.options.filter((option) => option.isCorrect).length !== 1
    ) {
      throw validationFailed({ options: ["ONE_CORRECT_REQUIRED"] });
    }
  } else if (input.acceptedAnswers.length === 0) {
    throw validationFailed({ acceptedAnswers: ["ACCEPTED_REQUIRED"] });
  }

  await db.$transaction([
    db.question.update({
      where: { id: question.id },
      data: {
        promptAr: input.promptAr,
        promptEn: input.promptEn,
        explanationAr: input.explanationAr.trim() === "" ? null : input.explanationAr,
        explanationEn: input.explanationEn.trim() === "" ? null : input.explanationEn,
        points: input.points,
        ...(isChoice ? {} : { acceptedAnswers: input.acceptedAnswers }),
      },
    }),
    ...(isChoice
      ? [
          db.option.deleteMany({ where: { questionId: question.id } }),
          db.option.createMany({
            data: input.options.map((option, index) => ({
              questionId: question.id,
              textAr: option.textAr,
              textEn: option.textEn,
              isCorrect: option.isCorrect,
              sortOrder: index,
            })),
          }),
        ]
      : []),
  ]);
}

export async function deleteQuestion(
  instructorId: string,
  courseId: string,
  lessonId: string,
  questionId: string,
): Promise<void> {
  await ownedLesson(instructorId, courseId, lessonId, "QUIZ");
  const deleted = await db.question.deleteMany({
    where: { id: questionId, quiz: { lessonId } },
  });
  if (deleted.count === 0) throw notFound("Question not found");
}
