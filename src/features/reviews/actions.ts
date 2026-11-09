"use server";

import { z } from "zod";

import { unauthorized } from "@/lib/errors";
import { createAction } from "@/server/action";
import { deleteReview, replyToReview, reportReview, upsertReview } from "@/server/reviews";

/** Review writes (P09-T01, BR-18). Eligibility and aggregation live in the service. */

const reviewInput = z.object({
  courseId: z.string().min(1).max(64),
  rating: z.number().int().min(1).max(5),
  body: z.string().max(2000),
});

const saveInternal = createAction<z.infer<typeof reviewInput>, { id: string }>({
  name: "review.save",
  schema: reviewInput,
  auth: "required",
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    return upsertReview({ user, ...input });
  },
});

const deleteInternal = createAction<{ reviewId: string }, { ok: true }>({
  name: "review.delete",
  schema: z.object({ reviewId: z.string().min(1).max(64) }),
  auth: "required",
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    await deleteReview(user, input.reviewId);
    return { ok: true };
  },
});

const replyInternal = createAction<{ reviewId: string; body: string }, { ok: true }>({
  name: "review.reply",
  schema: z.object({
    reviewId: z.string().min(1).max(64),
    body: z.string().trim().min(2).max(2000),
  }),
  auth: "required",
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    await replyToReview({ user, reviewId: input.reviewId, body: input.body });
    return { ok: true };
  },
});

const reportInternal = createAction<
  { reviewId: string; reason: string; details: string },
  { ok: true }
>({
  name: "review.report",
  schema: z.object({
    reviewId: z.string().min(1).max(64),
    reason: z.string().trim().min(3).max(200),
    details: z.string().max(2000),
  }),
  auth: "required",
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    await reportReview({ user, ...input });
    return { ok: true };
  },
});

export async function saveReviewAction(input: unknown) {
  return saveInternal(input);
}
export async function deleteReviewAction(input: unknown) {
  return deleteInternal(input);
}
export async function replyToReviewAction(input: unknown) {
  return replyInternal(input);
}
export async function reportReviewAction(input: unknown) {
  return reportInternal(input);
}
