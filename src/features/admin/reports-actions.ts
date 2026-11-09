"use server";

import { z } from "zod";

import { unauthorized } from "@/lib/errors";
import { createAction } from "@/server/action";
import { decideReport } from "@/server/admin/reports";

/** Report decisions (P10-T04). Hiding content is atomic with resolving the report. */

const decideInternal = createAction<
  { reportId: string; decision: "RESOLVED" | "DISMISSED"; hide: boolean },
  { ok: true }
>({
  name: "admin.decideReport",
  schema: z.object({
    reportId: z.string().min(1).max(64),
    decision: z.enum(["RESOLVED", "DISMISSED"]),
    hide: z.boolean().default(false),
  }),
  roles: ["ADMIN"],
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    await decideReport({
      adminId: user.id,
      reportId: input.reportId,
      decision: input.decision,
      hide: input.hide,
    });
    return { ok: true };
  },
});

export async function decideReportAction(input: unknown) {
  return decideInternal(input);
}
