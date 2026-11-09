"use server";

import { z } from "zod";

import { unauthorized } from "@/lib/errors";
import { createAction } from "@/server/action";
import { banUser, recordImpersonation, setUserRole, unbanUser } from "@/server/admin/users-admin";
import { createCategory, deleteCategory, updateCategory } from "@/server/admin/categories";
import { approveApplication, rejectApplication } from "@/server/admin/applications";
import {
  approveCourse,
  archiveCourse,
  rejectCourse,
  relistCourse,
  unlistCourse,
} from "@/server/admin/review";

/** Admin review actions (P05-T02). Role ADMIN is enforced by `createAction`. */
const courseId = z.object({ courseId: z.string().min(1, { message: "COURSE_REQUIRED" }) });

const approveSchema = courseId.extend({ note: z.string().trim().max(2000).optional() });

const approveInternal = createAction<z.infer<typeof approveSchema>, { approved: true }>({
  name: "admin.approveCourse",
  schema: approveSchema,
  roles: ["ADMIN"],
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    await approveCourse(user.id, input.courseId, input.note);
    return { approved: true };
  },
});

export async function approveCourseAction(input: unknown) {
  return approveInternal(input);
}

const rejectInternal = createAction<
  {
    courseId: string;
    reason: string;
    notes: Array<{ label: string; note: string }>;
  },
  { rejected: true }
>({
  name: "admin.rejectCourse",
  schema: courseId.extend({
    reason: z
      .string()
      .trim()
      .min(10, { message: "REASON_TOO_SHORT" })
      .max(2000, { message: "REASON_TOO_LONG" }),
    notes: z
      .array(
        z.object({
          label: z.string().max(200),
          note: z.string().max(1000),
        }),
      )
      .max(20)
      .default([]),
  }),
  roles: ["ADMIN"],
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    await rejectCourse(user.id, input.courseId, input.reason, input.notes);
    return { rejected: true };
  },
});

export async function rejectCourseAction(input: unknown) {
  return rejectInternal(input);
}

const unlistInternal = createAction<{ courseId: string }, { unlisted: true }>({
  name: "admin.unlistCourse",
  schema: courseId,
  roles: ["ADMIN"],
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    await unlistCourse(user.id, input.courseId);
    return { unlisted: true };
  },
});

export async function unlistCourseAction(input: unknown) {
  return unlistInternal(input);
}

const archiveInternal = createAction<{ courseId: string }, { archived: true }>({
  name: "admin.archiveCourse",
  schema: courseId,
  roles: ["ADMIN"],
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    await archiveCourse(user.id, input.courseId);
    return { archived: true };
  },
});

export async function archiveCourseAction(input: unknown) {
  return archiveInternal(input);
}

const relistInternal = createAction<{ courseId: string }, { published: true }>({
  name: "admin.relistCourse",
  schema: courseId,
  roles: ["ADMIN"],
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    await relistCourse(user.id, input.courseId);
    return { published: true };
  },
});

export async function relistCourseAction(input: unknown) {
  return relistInternal(input);
}

/* -------------------------------------------------------------------------- */
/* Instructor applications (P05-T03)                                           */
/* -------------------------------------------------------------------------- */

const approveApplicationInternal = createAction<{ applicationId: string }, { approved: true }>({
  name: "admin.approveApplication",
  schema: z.object({ applicationId: z.string().min(1) }),
  roles: ["ADMIN"],
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    await approveApplication(user.id, input.applicationId);
    return { approved: true };
  },
});

export async function approveApplicationAction(input: unknown) {
  return approveApplicationInternal(input);
}

const rejectApplicationInternal = createAction<
  { applicationId: string; reason: string },
  { rejected: true }
>({
  name: "admin.rejectApplication",
  schema: z.object({
    applicationId: z.string().min(1),
    reason: z
      .string()
      .trim()
      .min(10, { message: "REASON_TOO_SHORT" })
      .max(2000, { message: "REASON_TOO_LONG" }),
  }),
  roles: ["ADMIN"],
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    await rejectApplication(user.id, input.applicationId, input.reason);
    return { rejected: true };
  },
});

export async function rejectApplicationAction(input: unknown) {
  return rejectApplicationInternal(input);
}

/* -------------------------------------------------------------------------- */
/* Users: role, ban and impersonation (P05-T03)                                */
/* -------------------------------------------------------------------------- */

const setRoleInternal = createAction<
  { userId: string; role: "STUDENT" | "INSTRUCTOR" | "ADMIN" },
  { saved: true }
>({
  name: "admin.setUserRole",
  schema: z.object({
    userId: z.string().min(1),
    role: z.enum(["STUDENT", "INSTRUCTOR", "ADMIN"]),
  }),
  roles: ["ADMIN"],
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    await setUserRole(user.id, input.userId, input.role);
    return { saved: true };
  },
});

export async function setUserRoleAction(input: unknown) {
  return setRoleInternal(input);
}

const banInternal = createAction<{ userId: string; reason: string }, { banned: true }>({
  name: "admin.banUser",
  schema: z.object({
    userId: z.string().min(1),
    reason: z.string().trim().min(10, { message: "REASON_TOO_SHORT" }).max(2000),
  }),
  roles: ["ADMIN"],
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    await banUser(user.id, input.userId, input.reason);
    return { banned: true };
  },
});

export async function banUserAction(input: unknown) {
  return banInternal(input);
}

const unbanInternal = createAction<{ userId: string }, { unbanned: true }>({
  name: "admin.unbanUser",
  schema: z.object({ userId: z.string().min(1) }),
  roles: ["ADMIN"],
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    await unbanUser(user.id, input.userId);
    return { unbanned: true };
  },
});

export async function unbanUserAction(input: unknown) {
  return unbanInternal(input);
}

const impersonateInternal = createAction<{ userId: string }, { recorded: true }>({
  name: "admin.recordImpersonation",
  schema: z.object({ userId: z.string().min(1) }),
  roles: ["ADMIN"],
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    await recordImpersonation(user.id, input.userId);
    return { recorded: true };
  },
});

export async function recordImpersonationAction(input: unknown) {
  return impersonateInternal(input);
}

/* -------------------------------------------------------------------------- */
/* Categories (P05-T04)                                                        */
/* -------------------------------------------------------------------------- */

const categorySchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, { message: "SLUG_INVALID" })
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: "SLUG_INVALID" }),
  nameAr: z.string().trim().min(1, { message: "NAME_REQUIRED" }).max(120),
  nameEn: z.string().trim().min(1, { message: "NAME_REQUIRED" }).max(120),
  icon: z.string().max(40).nullable(),
  sortOrder: z.number().int().min(0).max(999),
  isActive: z.boolean(),
});

const createCategoryInternal = createAction<z.infer<typeof categorySchema>, { id: string }>({
  name: "admin.createCategory",
  schema: categorySchema,
  roles: ["ADMIN"],
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    return createCategory(user.id, input);
  },
});

export async function createCategoryAction(input: unknown) {
  return createCategoryInternal(input);
}

const updateCategoryInternal = createAction<
  z.infer<typeof categorySchema> & { id: string },
  { saved: true }
>({
  name: "admin.updateCategory",
  schema: categorySchema.extend({ id: z.string().min(1) }),
  roles: ["ADMIN"],
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    const { id, ...fields } = input;
    await updateCategory(user.id, id, fields);
    return { saved: true };
  },
});

export async function updateCategoryAction(input: unknown) {
  return updateCategoryInternal(input);
}

const deleteCategoryInternal = createAction<{ id: string }, { deleted: true }>({
  name: "admin.deleteCategory",
  schema: z.object({ id: z.string().min(1) }),
  roles: ["ADMIN"],
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    await deleteCategory(user.id, input.id);
    return { deleted: true };
  },
});

export async function deleteCategoryAction(input: unknown) {
  return deleteCategoryInternal(input);
}
