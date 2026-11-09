"use server";

import { z } from "zod";

import { unauthorized } from "@/lib/errors";
import { createAction } from "@/server/action";
import { markAllNotificationsRead, markNotificationRead } from "@/server/notifications";

/** Notification reads (P09-T02). Only the owner's rows are affected. */

const readInternal = createAction<{ id: string }, { ok: true }>({
  name: "notification.read",
  schema: z.object({ id: z.string().min(1).max(64) }),
  auth: "required",
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    await markNotificationRead(user.id, input.id);
    return { ok: true };
  },
});

const readAllInternal = createAction<void, { ok: true }>({
  name: "notification.readAll",
  schema: z.undefined(),
  auth: "required",
  handler: async ({ user }) => {
    if (user === null) throw unauthorized();
    await markAllNotificationsRead(user.id);
    return { ok: true };
  },
});

export async function markNotificationReadAction(input: unknown) {
  return readInternal(input);
}
export async function markAllNotificationsReadAction(input: unknown = undefined) {
  return readAllInternal(input);
}
