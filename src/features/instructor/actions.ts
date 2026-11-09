"use server";

import { unauthorized } from "@/lib/errors";
import { createAction } from "@/server/action";
import { submitInstructorApplication } from "@/server/instructor";

import { instructorApplicationSchema, type InstructorApplicationInput } from "./schema";

/**
 * Submit an instructor application (the product requirements).
 *
 * A signed-in student only: instructors and admins already have the role, and a second application
 * while one is pending or approved is a conflict, not a duplicate row.
 */

const submitInternal = createAction<InstructorApplicationInput, { id: string }>({
  name: "instructor.apply",
  schema: instructorApplicationSchema,
  auth: "required",
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    return submitInstructorApplication(user.id, input);
  },
});

export async function submitInstructorApplicationAction(input: unknown) {
  return submitInternal(input);
}
