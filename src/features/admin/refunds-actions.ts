"use server";

import { z } from "zod";

import { unauthorized } from "@/lib/errors";
import { createAction } from "@/server/action";
import { approveRefund, rejectRefund } from "@/server/admin/refunds";

/** Admin refund decisions (P10-T03). The role is enforced by `createAction`. */

const approveInternal = createAction<{ refundId: string; note: string }, { approved: true }>({
  name: "admin.approveRefund",
  schema: z.object({
    refundId: z.string().min(1).max(64),
    note: z.string().trim().max(2000).default(""),
  }),
  roles: ["ADMIN"],
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    await approveRefund({ adminId: user.id, refundId: input.refundId, note: input.note });
    return { approved: true };
  },
});

export async function approveRefundAction(input: unknown) {
  return approveInternal(input);
}

const rejectInternal = createAction<{ refundId: string; note: string }, { rejected: true }>({
  name: "admin.rejectRefund",
  schema: z.object({
    refundId: z.string().min(1).max(64),
    note: z.string().trim().min(5).max(2000),
  }),
  roles: ["ADMIN"],
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    await rejectRefund({ adminId: user.id, refundId: input.refundId, note: input.note });
    return { rejected: true };
  },
});

export async function rejectRefundAction(input: unknown) {
  return rejectInternal(input);
}
