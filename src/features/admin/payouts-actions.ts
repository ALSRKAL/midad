"use server";

import { z } from "zod";

import { unauthorized } from "@/lib/errors";
import { createAction } from "@/server/action";
import { approvePayout, markPayoutPaid, rejectPayout } from "@/server/admin/payouts";

/** Admin payout decisions (P10-T04). The role is enforced by `createAction`. */

const payoutId = z.object({ payoutId: z.string().min(1).max(64) });

const approveInternal = createAction<{ payoutId: string }, { ok: true }>({
  name: "admin.approvePayout",
  schema: payoutId,
  roles: ["ADMIN"],
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    await approvePayout({ adminId: user.id, payoutId: input.payoutId });
    return { ok: true };
  },
});

export async function approvePayoutAction(input: unknown) {
  return approveInternal(input);
}

const paidInternal = createAction<{ payoutId: string; transferReference: string }, { ok: true }>({
  name: "admin.markPayoutPaid",
  schema: z.object({
    payoutId: z.string().min(1).max(64),
    transferReference: z.string().trim().min(3).max(200),
  }),
  roles: ["ADMIN"],
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    await markPayoutPaid({
      adminId: user.id,
      payoutId: input.payoutId,
      transferReference: input.transferReference,
    });
    return { ok: true };
  },
});

export async function markPayoutPaidAction(input: unknown) {
  return paidInternal(input);
}

const rejectInternal = createAction<{ payoutId: string; note: string }, { ok: true }>({
  name: "admin.rejectPayout",
  schema: z.object({
    payoutId: z.string().min(1).max(64),
    note: z.string().trim().min(5).max(2000),
  }),
  roles: ["ADMIN"],
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    await rejectPayout({ adminId: user.id, payoutId: input.payoutId, note: input.note });
    return { ok: true };
  },
});

export async function rejectPayoutAction(input: unknown) {
  return rejectInternal(input);
}
