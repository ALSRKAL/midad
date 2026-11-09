"use server";

import { z } from "zod";

import { forbidden, unauthorized } from "@/lib/errors";
import { createAction } from "@/server/action";
import { getInstructorProfileId } from "@/server/instructor-courses";
import {
  addAttachment,
  addQuestion,
  deleteAttachment,
  deleteQuestion,
  saveQuestion,
  updateLessonText,
  updateQuizSettings,
  type QuestionType,
} from "@/server/lesson-content";

const ref = z.object({
  courseId: z.string().min(1, { message: "COURSE_REQUIRED" }),
  lessonId: z.string().min(1, { message: "LESSON_REQUIRED" }),
});

async function instructorIdFor(userId: string): Promise<string> {
  const instructorId = await getInstructorProfileId(userId);
  if (instructorId === null) throw forbidden("INSTRUCTOR_PROFILE_REQUIRED");
  return instructorId;
}

const textSchema = ref.extend({
  contentAr: z.string().max(80_000, { message: "CONTENT_TOO_LONG" }),
  contentEn: z.string().max(80_000, { message: "CONTENT_TOO_LONG" }),
});

const saveTextInternal = createAction<z.infer<typeof textSchema>, { saved: true }>({
  name: "lesson.saveText",
  schema: textSchema,
  auth: "required",
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    const instructorId = await instructorIdFor(user.id);
    await updateLessonText(
      instructorId,
      input.courseId,
      input.lessonId,
      input.contentAr,
      input.contentEn,
    );
    return { saved: true };
  },
});

export async function saveLessonTextAction(input: unknown) {
  return saveTextInternal(input);
}

const attachmentUploadSchema = ref.extend({
  file: z.instanceof(File, { message: "ATTACHMENT_REQUIRED" }),
});

const uploadAttachmentInternal = createAction<
  z.infer<typeof attachmentUploadSchema>,
  { id: string; title: string; mimeType: string; sizeBytes: number; createdAt: string }
>({
  name: "lesson.uploadAttachment",
  schema: attachmentUploadSchema,
  auth: "required",
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    const instructorId = await instructorIdFor(user.id);
    const created = await addAttachment(instructorId, input.courseId, input.lessonId, input.file);
    return {
      id: created.id,
      title: created.title,
      mimeType: created.mimeType,
      sizeBytes: created.sizeBytes,
      createdAt: created.createdAt.toISOString(),
    };
  },
});

export async function uploadAttachmentAction(input: unknown) {
  return uploadAttachmentInternal(input);
}

const attachmentDeleteInternal = createAction<{ attachmentId: string }, { deleted: true }>({
  name: "lesson.deleteAttachment",
  schema: z.object({ attachmentId: z.string().min(1) }),
  auth: "required",
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    const instructorId = await instructorIdFor(user.id);
    await deleteAttachment(instructorId, input.attachmentId);
    return { deleted: true };
  },
});

export async function deleteAttachmentAction(input: unknown) {
  return attachmentDeleteInternal(input);
}

const quizSettingsSchema = ref.extend({
  titleAr: z.string().trim().max(160, { message: "TITLE_TOO_LONG" }),
  titleEn: z.string().trim().max(160, { message: "TITLE_TOO_LONG" }),
  descriptionAr: z.string().trim().max(2000, { message: "DESCRIPTION_TOO_LONG" }),
  descriptionEn: z.string().trim().max(2000, { message: "DESCRIPTION_TOO_LONG" }),
  passPct: z.number().int().min(1, { message: "PASS_RANGE" }).max(100, { message: "PASS_RANGE" }),
  maxAttempts: z
    .number()
    .int()
    .min(1, { message: "ATTEMPTS_RANGE" })
    .max(100, { message: "ATTEMPTS_RANGE" }),
  timeLimitSec: z.number().int().min(60).max(86_400).nullable(),
  shuffleQuestions: z.boolean(),
  shuffleOptions: z.boolean(),
});

const saveQuizSettingsInternal = createAction<z.infer<typeof quizSettingsSchema>, { saved: true }>({
  name: "lesson.saveQuizSettings",
  schema: quizSettingsSchema,
  auth: "required",
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    const instructorId = await instructorIdFor(user.id);
    await updateQuizSettings(instructorId, input.courseId, input.lessonId, {
      titleAr: input.titleAr,
      titleEn: input.titleEn,
      descriptionAr: input.descriptionAr,
      descriptionEn: input.descriptionEn,
      passPct: input.passPct,
      maxAttempts: input.maxAttempts,
      timeLimitSec: input.timeLimitSec,
      shuffleQuestions: input.shuffleQuestions,
      shuffleOptions: input.shuffleOptions,
    });
    return { saved: true };
  },
});

export async function saveQuizSettingsAction(input: unknown) {
  return saveQuizSettingsInternal(input);
}

const addQuestionSchema = ref.extend({
  type: z.enum(["SINGLE_CHOICE", "MULTI_CHOICE", "TRUE_FALSE", "SHORT_ANSWER"], {
    message: "QUESTION_TYPE_INVALID",
  }),
});

const addQuestionInternal = createAction<
  { courseId: string; lessonId: string; type: QuestionType },
  { id: string }
>({
  name: "lesson.addQuestion",
  schema: addQuestionSchema,
  auth: "required",
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    const instructorId = await instructorIdFor(user.id);
    return addQuestion(instructorId, input.courseId, input.lessonId, input.type);
  },
});

export async function addQuestionAction(input: unknown) {
  return addQuestionInternal(input);
}

const optionSchema = z.object({
  textAr: z.string().max(500),
  textEn: z.string().max(500),
  isCorrect: z.boolean(),
});

const saveQuestionSchema = ref.extend({
  questionId: z.string().min(1),
  promptAr: z.string().max(2000),
  promptEn: z.string().max(2000),
  explanationAr: z.string().max(4000),
  explanationEn: z.string().max(4000),
  points: z
    .number()
    .int()
    .min(1, { message: "POINTS_RANGE" })
    .max(100, { message: "POINTS_RANGE" }),
  acceptedAnswers: z.array(z.string().max(300)).max(30),
  options: z.array(optionSchema).max(20),
});

const saveQuestionInternal = createAction<z.infer<typeof saveQuestionSchema>, { saved: true }>({
  name: "lesson.saveQuestion",
  schema: saveQuestionSchema,
  auth: "required",
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    const instructorId = await instructorIdFor(user.id);
    await saveQuestion(instructorId, input.courseId, input.lessonId, input.questionId, {
      promptAr: input.promptAr,
      promptEn: input.promptEn,
      explanationAr: input.explanationAr,
      explanationEn: input.explanationEn,
      points: input.points,
      acceptedAnswers: input.acceptedAnswers,
      options: input.options,
    });
    return { saved: true };
  },
});

export async function saveQuestionAction(input: unknown) {
  return saveQuestionInternal(input);
}

const deleteQuestionInternal = createAction<
  { courseId: string; lessonId: string; questionId: string },
  { deleted: true }
>({
  name: "lesson.deleteQuestion",
  schema: ref.extend({ questionId: z.string().min(1) }),
  auth: "required",
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    const instructorId = await instructorIdFor(user.id);
    await deleteQuestion(instructorId, input.courseId, input.lessonId, input.questionId);
    return { deleted: true };
  },
});

export async function deleteQuestionAction(input: unknown) {
  return deleteQuestionInternal(input);
}
