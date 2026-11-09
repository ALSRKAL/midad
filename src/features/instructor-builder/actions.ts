"use server";

import { z } from "zod";

import { forbidden, unauthorized } from "@/lib/errors";
import { createAction } from "@/server/action";
import {
  createCourseDraft,
  getInstructorProfileId,
  replaceCourseObjectives,
  updateCourseBasics,
  uploadCourseCover,
} from "@/server/instructor-courses";
import {
  addLesson,
  addSection,
  deleteLesson,
  deleteSection,
  moveLesson,
  renameLesson,
  renameSection,
  reorderLessons,
  reorderSections,
  setLessonPreview,
} from "@/server/curriculum";
import { submitCourseForReview, updateCoursePricing } from "@/server/course-publish";

import {
  courseBasicsSchema,
  courseCoverSchema,
  lessonCreateSchema,
  lessonDeleteSchema,
  lessonMoveSchema,
  lessonPreviewSchema,
  lessonRenameSchema,
  lessonReorderSchema,
  sectionCreateSchema,
  sectionDeleteSchema,
  sectionRenameSchema,
  sectionReorderSchema,
  type CourseBasicsInput,
} from "./schema";
/**
 * Create an empty draft course and send the instructor to its editor.
 *
 * The author is resolved from the session, never from the request. An admin without an instructor
 * profile is refused with a stable code the dashboard explains, instead of receiving an empty list.
 */
const createInternal = createAction<Record<string, never>, { id: string }>({
  name: "instructor.createCourse",
  schema: z.object({}),
  roles: ["INSTRUCTOR", "ADMIN"],
  handler: async ({ user }) => {
    if (user === null) throw unauthorized();
    const instructorId = await getInstructorProfileId(user.id);
    if (instructorId === null) throw forbidden("INSTRUCTOR_PROFILE_REQUIRED");
    return createCourseDraft(instructorId);
  },
});

export async function createCourseDraftAction() {
  return createInternal({});
}

const updateBasicsInternal = createAction<CourseBasicsInput, { updatedAt: string }>({
  name: "instructor.updateCourseBasics",
  schema: courseBasicsSchema,
  auth: "required",
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    const instructorId = await getInstructorProfileId(user.id);
    if (instructorId === null) throw forbidden("INSTRUCTOR_PROFILE_REQUIRED");

    const { courseId, ...fields } = input;
    const result = await updateCourseBasics(instructorId, user.id, courseId, fields);
    return { updatedAt: result.updatedAt.toISOString() };
  },
});

export async function updateCourseBasicsAction(input: unknown) {
  return updateBasicsInternal(input);
}

const uploadCoverInternal = createAction<
  { courseId: string; cover: File },
  { coverImageKey: string; coverUrl: string }
>({
  name: "instructor.uploadCourseCover",
  schema: courseCoverSchema,
  auth: "required",
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    const instructorId = await getInstructorProfileId(user.id);
    if (instructorId === null) throw forbidden("INSTRUCTOR_PROFILE_REQUIRED");
    return uploadCourseCover(instructorId, input.courseId, input.cover);
  },
});

export async function uploadCourseCoverAction(input: unknown) {
  return uploadCoverInternal(input);
}

/* -------------------------------------------------------------------------- */
/* Curriculum (P04-T03)                                                        */
/* -------------------------------------------------------------------------- */

async function instructorIdFor(userId: string): Promise<string> {
  const instructorId = await getInstructorProfileId(userId);
  if (instructorId === null) throw forbidden("INSTRUCTOR_PROFILE_REQUIRED");
  return instructorId;
}

const addSectionInternal = createAction<
  { courseId: string; titleAr: string; titleEn: string },
  { id: string }
>({
  name: "curriculum.addSection",
  schema: sectionCreateSchema,
  auth: "required",
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    const instructorId = await instructorIdFor(user.id);
    return addSection(instructorId, input.courseId, input.titleAr, input.titleEn);
  },
});

export async function addSectionAction(input: unknown) {
  return addSectionInternal(input);
}

const renameSectionInternal = createAction<
  { courseId: string; sectionId: string; titleAr: string; titleEn: string },
  { saved: true }
>({
  name: "curriculum.renameSection",
  schema: sectionRenameSchema,
  auth: "required",
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    const instructorId = await instructorIdFor(user.id);
    await renameSection(
      instructorId,
      input.courseId,
      input.sectionId,
      input.titleAr,
      input.titleEn,
    );
    return { saved: true };
  },
});

export async function renameSectionAction(input: unknown) {
  return renameSectionInternal(input);
}

const deleteSectionInternal = createAction<
  { courseId: string; sectionId: string },
  { deleted: true }
>({
  name: "curriculum.deleteSection",
  schema: sectionDeleteSchema,
  auth: "required",
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    const instructorId = await instructorIdFor(user.id);
    await deleteSection(instructorId, input.courseId, input.sectionId);
    return { deleted: true };
  },
});

export async function deleteSectionAction(input: unknown) {
  return deleteSectionInternal(input);
}

const addLessonInternal = createAction<
  {
    courseId: string;
    sectionId: string;
    type: "VIDEO" | "TEXT" | "FILE" | "QUIZ";
    titleAr: string;
    titleEn: string;
  },
  { id: string }
>({
  name: "curriculum.addLesson",
  schema: lessonCreateSchema,
  auth: "required",
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    const instructorId = await instructorIdFor(user.id);
    return addLesson(
      instructorId,
      input.courseId,
      input.sectionId,
      input.type,
      input.titleAr,
      input.titleEn,
    );
  },
});

export async function addLessonAction(input: unknown) {
  return addLessonInternal(input);
}

const renameLessonInternal = createAction<
  { courseId: string; lessonId: string; titleAr: string; titleEn: string },
  { saved: true }
>({
  name: "curriculum.renameLesson",
  schema: lessonRenameSchema,
  auth: "required",
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    const instructorId = await instructorIdFor(user.id);
    await renameLesson(instructorId, input.courseId, input.lessonId, input.titleAr, input.titleEn);
    return { saved: true };
  },
});

export async function renameLessonAction(input: unknown) {
  return renameLessonInternal(input);
}

const deleteLessonInternal = createAction<
  { courseId: string; lessonId: string },
  { deleted: true }
>({
  name: "curriculum.deleteLesson",
  schema: lessonDeleteSchema,
  auth: "required",
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    const instructorId = await instructorIdFor(user.id);
    await deleteLesson(instructorId, input.courseId, input.lessonId);
    return { deleted: true };
  },
});

export async function deleteLessonAction(input: unknown) {
  return deleteLessonInternal(input);
}

const reorderSectionsInternal = createAction<
  { courseId: string; orderedIds: string[] },
  { saved: true }
>({
  name: "curriculum.reorderSections",
  schema: sectionReorderSchema,
  auth: "required",
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    const instructorId = await instructorIdFor(user.id);
    await reorderSections(instructorId, input.courseId, input.orderedIds);
    return { saved: true };
  },
});

export async function reorderSectionsAction(input: unknown) {
  return reorderSectionsInternal(input);
}

const reorderLessonsInternal = createAction<
  { courseId: string; sectionId: string; orderedIds: string[] },
  { saved: true }
>({
  name: "curriculum.reorderLessons",
  schema: lessonReorderSchema,
  auth: "required",
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    const instructorId = await instructorIdFor(user.id);
    await reorderLessons(instructorId, input.courseId, input.sectionId, input.orderedIds);
    return { saved: true };
  },
});

export async function reorderLessonsAction(input: unknown) {
  return reorderLessonsInternal(input);
}

const moveLessonInternal = createAction<
  { courseId: string; lessonId: string; targetSectionId: string },
  { saved: true }
>({
  name: "curriculum.moveLesson",
  schema: lessonMoveSchema,
  auth: "required",
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    const instructorId = await instructorIdFor(user.id);
    await moveLesson(instructorId, input.courseId, input.lessonId, input.targetSectionId);
    return { saved: true };
  },
});

export async function moveLessonAction(input: unknown) {
  return moveLessonInternal(input);
}

const setPreviewInternal = createAction<
  { courseId: string; lessonId: string; isPreview: boolean },
  { saved: true }
>({
  name: "curriculum.setLessonPreview",
  schema: lessonPreviewSchema,
  auth: "required",
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    const instructorId = await instructorIdFor(user.id);
    await setLessonPreview(instructorId, input.courseId, input.lessonId, input.isPreview);
    return { saved: true };
  },
});

export async function setLessonPreviewAction(input: unknown) {
  return setPreviewInternal(input);
}

/* -------------------------------------------------------------------------- */
/* Pricing and submission (P04-T06)                                            */
/* -------------------------------------------------------------------------- */

const pricingInternal = createAction<
  { courseId: string; isFree: boolean; priceCents: number },
  { saved: true }
>({
  name: "instructor.updatePricing",
  schema: z.object({
    courseId: z.string().min(1),
    isFree: z.boolean(),
    priceCents: z.number().int().min(0, { message: "PRICE_INVALID" }),
  }),
  auth: "required",
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    const instructorId = await instructorIdFor(user.id);
    await updateCoursePricing(instructorId, user.id, input.courseId, {
      isFree: input.isFree,
      priceCents: input.priceCents,
    });
    return { saved: true };
  },
});

export async function updateCoursePricingAction(input: unknown) {
  return pricingInternal(input);
}

const objectivesInternal = createAction<
  { courseId: string; objectives: Array<{ textAr: string; textEn: string }> },
  { saved: true }
>({
  name: "instructor.saveObjectives",
  schema: z.object({
    courseId: z.string().min(1),
    objectives: z
      .array(
        z.object({
          textAr: z.string().max(300, { message: "OBJECTIVE_TOO_LONG" }),
          textEn: z.string().max(300, { message: "OBJECTIVE_TOO_LONG" }),
        }),
      )
      .max(20),
  }),
  auth: "required",
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    const instructorId = await instructorIdFor(user.id);
    await replaceCourseObjectives(instructorId, input.courseId, input.objectives);
    return { saved: true };
  },
});

export async function saveCourseObjectivesAction(input: unknown) {
  return objectivesInternal(input);
}

const submitInternal = createAction<{ courseId: string }, { status: "PENDING_REVIEW" }>({
  name: "instructor.submitForReview",
  schema: z.object({ courseId: z.string().min(1) }),
  auth: "required",
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    const instructorId = await instructorIdFor(user.id);
    return submitCourseForReview(instructorId, user.id, input.courseId);
  },
});

export async function submitCourseForReviewAction(input: unknown) {
  return submitInternal(input);
}
