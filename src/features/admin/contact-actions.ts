"use server";

import { z } from "zod";

import { unauthorized } from "@/lib/errors";
import { createAction } from "@/server/action";
import { setContactStatus } from "@/server/admin/contact";

/** Contact message status (P10-T04). */

const statusInternal = createAction<
  { messageId: string; status: "READ" | "ARCHIVED" },
  { ok: true }
>({
  name: "admin.contactStatus",
  schema: z.object({
    messageId: z.string().min(1).max(64),
    status: z.enum(["READ", "ARCHIVED"]),
  }),
  roles: ["ADMIN"],
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    await setContactStatus({ adminId: user.id, ...input });
    return { ok: true };
  },
});

export async function setContactStatusAction(input: unknown) {
  return statusInternal(input);
}
