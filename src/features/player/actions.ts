"use server";

import { z } from "zod";

import { unauthorized } from "@/lib/errors";
import { createAction } from "@/server/action";
import { saveWatchProgress, setLessonCompleted } from "@/server/progress";

/** Player progress writes (P07-T04). Session, enrolment and lesson type are checked server-side. */

const progressSchema = z.object({
  lessonId: z.string().min(1).max(64),
  startSec: z.number().finite().min(0).max(86_400),
  endSec: z.number().finite().min(0).max(86_400),
  positionSec: z.number().finite().min(0).max(86_400),
});

const saveInternal = createAction<
  z.infer<typeof progressSchema>,
  { progressPct: number; lessonCompleted: boolean }
>({
  name: "progress.save",
  schema: progressSchema,
  auth: "required",
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    return saveWatchProgress({ userId: user.id, ...input });
  },
});

const completeInternal = createAction<
  { lessonId: string; completed: boolean },
  { progressPct: number; lessonCompleted: boolean }
>({
  name: "progress.complete",
  schema: z.object({ lessonId: z.string().min(1).max(64), completed: z.boolean() }),
  auth: "required",
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    return setLessonCompleted({ userId: user.id, ...input });
  },
});

export async function saveProgressAction(input: unknown) {
  return saveInternal(input);
}
export async function setLessonCompletedAction(input: unknown) {
  return completeInternal(input);
}
