"use server";

import { z } from "zod";

import { unauthorized } from "@/lib/errors";
import { createAction } from "@/server/action";
import { requestRefund } from "@/server/refunds";

/** Student refund requests (P10-T03). BR-10 is enforced inside the service. */

const requestInternal = createAction<{ orderId: string; reason: string }, { id: string }>({
  name: "refund.request",
  schema: z.object({
    orderId: z.string().min(1).max(64),
    reason: z.string().trim().min(10).max(2000),
  }),
  auth: "required",
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    return requestRefund({ user, orderId: input.orderId, reason: input.reason });
  },
});

export async function requestRefundAction(input: unknown) {
  return requestInternal(input);
}
