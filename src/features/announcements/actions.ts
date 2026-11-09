"use server";

import { z } from "zod";

import { unauthorized } from "@/lib/errors";
import { createAction } from "@/server/action";
import { createAnnouncement } from "@/server/announcements";

/** Instructor announcement creation (P09-T04). */
const createInternal = createAction<
  { courseId: string; title: string; body: string },
  { id: string }
>({
  name: "announcement.create",
  schema: z.object({
    courseId: z.string().min(1).max(64),
    title: z.string().trim().min(3).max(160),
    body: z.string().trim().min(10).max(5000),
  }),
  auth: "required",
  roles: ["INSTRUCTOR", "ADMIN"],
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    return createAnnouncement({ user, ...input });
  },
});

export async function createAnnouncementAction(input: unknown) {
  return createInternal(input);
}
