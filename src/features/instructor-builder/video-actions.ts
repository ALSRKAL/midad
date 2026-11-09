"use server";

import { z } from "zod";

import { forbidden, unauthorized } from "@/lib/errors";
import { createAction } from "@/server/action";
import { getInstructorProfileId } from "@/server/instructor-courses";
import {
  abortVideoUpload,
  completeVideoUpload,
  getVideoStatus,
  resumeVideoUpload,
  startVideoUpload,
  type VideoStatus,
  type VideoUploadSession,
} from "@/server/video-upload";

const lessonRef = z.object({
  courseId: z.string().min(1, { message: "COURSE_REQUIRED" }),
  lessonId: z.string().min(1, { message: "LESSON_REQUIRED" }),
});

const startSchema = lessonRef.extend({
  fileName: z.string().min(1).max(255),
  sizeBytes: z.number().int().positive(),
  contentType: z.string().min(1).max(100),
});

async function instructorIdFor(userId: string): Promise<string> {
  const instructorId = await getInstructorProfileId(userId);
  if (instructorId === null) throw forbidden("INSTRUCTOR_PROFILE_REQUIRED");
  return instructorId;
}

const startInternal = createAction<z.infer<typeof startSchema>, VideoUploadSession>({
  name: "video.startUpload",
  schema: startSchema,
  auth: "required",
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    const instructorId = await instructorIdFor(user.id);
    return startVideoUpload(instructorId, input.courseId, input.lessonId, {
      fileName: input.fileName,
      sizeBytes: input.sizeBytes,
      contentType: input.contentType,
    });
  },
});

export async function startVideoUploadAction(input: unknown) {
  return startInternal(input);
}

const resumeInternal = createAction<z.infer<typeof lessonRef>, VideoUploadSession>({
  name: "video.resumeUpload",
  schema: lessonRef,
  auth: "required",
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    const instructorId = await instructorIdFor(user.id);
    return resumeVideoUpload(instructorId, input.courseId, input.lessonId);
  },
});

export async function resumeVideoUploadAction(input: unknown) {
  return resumeInternal(input);
}

const completeInternal = createAction<z.infer<typeof lessonRef>, { status: "PROCESSING" }>({
  name: "video.completeUpload",
  schema: lessonRef,
  auth: "required",
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    const instructorId = await instructorIdFor(user.id);
    return completeVideoUpload(instructorId, input.courseId, input.lessonId);
  },
});

export async function completeVideoUploadAction(input: unknown) {
  return completeInternal(input);
}

const abortInternal = createAction<z.infer<typeof lessonRef>, { aborted: true }>({
  name: "video.abortUpload",
  schema: lessonRef,
  auth: "required",
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    const instructorId = await instructorIdFor(user.id);
    await abortVideoUpload(instructorId, input.courseId, input.lessonId);
    return { aborted: true };
  },
});

export async function abortVideoUploadAction(input: unknown) {
  return abortInternal(input);
}

const statusInternal = createAction<z.infer<typeof lessonRef>, VideoStatus>({
  name: "video.status",
  schema: lessonRef,
  auth: "required",
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    const instructorId = await instructorIdFor(user.id);
    return getVideoStatus(instructorId, input.courseId, input.lessonId);
  },
});

export async function getVideoStatusAction(input: unknown) {
  return statusInternal(input);
}
