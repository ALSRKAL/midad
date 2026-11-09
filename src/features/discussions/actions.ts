"use server";

import { z } from "zod";

import { unauthorized } from "@/lib/errors";
import { createAction } from "@/server/action";
import { acceptAnswer, addNote, createReply, createThread, deleteNote } from "@/server/discussions";

/** Notes and discussion writes (P07-T05, BR-19). */

const noteCreate = createAction<
  { lessonId: string; body: string; timestampSec: number | null },
  { id: string }
>({
  name: "note.create",
  schema: z.object({
    lessonId: z.string().min(1).max(64),
    body: z.string().trim().min(2).max(4000),
    timestampSec: z.number().int().min(0).max(86_400).nullable(),
  }),
  auth: "required",
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    return addNote({ userId: user.id, ...input });
  },
});

const noteDelete = createAction<{ noteId: string }, { ok: true }>({
  name: "note.delete",
  schema: z.object({ noteId: z.string().min(1).max(64) }),
  auth: "required",
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    await deleteNote(user.id, input.noteId);
    return { ok: true };
  },
});

const threadCreate = createAction<
  { courseId: string; lessonId: string | null; title: string; body: string },
  { id: string }
>({
  name: "thread.create",
  schema: z.object({
    courseId: z.string().min(1).max(64),
    lessonId: z.string().min(1).max(64).nullable(),
    title: z.string().trim().min(3).max(160),
    body: z.string().trim().min(10).max(4000),
  }),
  auth: "required",
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    return createThread({ user, ...input });
  },
});

const replyCreate = createAction<{ threadId: string; body: string }, { id: string }>({
  name: "thread.reply",
  schema: z.object({
    threadId: z.string().min(1).max(64),
    body: z.string().trim().min(2).max(4000),
  }),
  auth: "required",
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    return createReply({ user, ...input });
  },
});

const answerAccept = createAction<{ threadId: string; replyId: string }, { ok: true }>({
  name: "thread.accept",
  schema: z.object({ threadId: z.string().min(1).max(64), replyId: z.string().min(1).max(64) }),
  auth: "required",
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    await acceptAnswer({ user, ...input });
    return { ok: true };
  },
});

export async function createNoteAction(input: unknown) {
  return noteCreate(input);
}
export async function deleteNoteAction(input: unknown) {
  return noteDelete(input);
}
export async function createThreadAction(input: unknown) {
  return threadCreate(input);
}
export async function createReplyAction(input: unknown) {
  return replyCreate(input);
}
export async function acceptAnswerAction(input: unknown) {
  return answerAccept(input);
}
