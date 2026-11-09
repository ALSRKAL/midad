"use server";

import { z } from "zod";

import { unauthorized } from "@/lib/errors";
import { createAction } from "@/server/action";
import { rateLimiter } from "@/server/limiter";
import { startQuizAttempt, submitQuizAttempt } from "@/server/quizzes";

/** Quiz writes (P08-T02, BR-16); all grading happens in `server/quizzes.ts`. */

const answerSchema = z.object({
  questionId: z.string().min(1).max(64),
  optionId: z.string().min(1).max(64).nullable().optional(),
  optionIds: z.array(z.string().min(1).max(64)).max(20).nullable().optional(),
  text: z.string().max(2000).nullable().optional(),
});

const startInternal = createAction<{ lessonId: string }, { attemptId: string }>({
  name: "quiz.start",
  schema: z.object({ lessonId: z.string().min(1).max(64) }),
  auth: "required",
  rateLimit: {
    key: ({ user }) => `quiz:start:${user?.id ?? "anonymous"}`,
    limit: 20,
    windowSec: 60,
    limiter: rateLimiter,
  },
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    return startQuizAttempt(user, input.lessonId);
  },
});

const submitInternal = createAction<
  { attemptId: string; answers: z.infer<typeof answerSchema>[] },
  { score: number; maxScore: number; percentage: number; passed: boolean }
>({
  name: "quiz.submit",
  schema: z.object({
    attemptId: z.string().min(1).max(64),
    answers: z.array(answerSchema).max(200),
  }),
  auth: "required",
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    return submitQuizAttempt(user, input.attemptId, input.answers);
  },
});

export async function startQuizAction(input: unknown) {
  return startInternal(input);
}
export async function submitQuizAction(input: unknown) {
  return submitInternal(input);
}
