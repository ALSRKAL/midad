"use server";

import { z } from "zod";

import { validationFailed } from "@/lib/errors";
import { parseMoneyInput } from "@/lib/money";
import { createAction } from "@/server/action";
import { requestPayout } from "@/server/earnings";

/** Instructor payout requests (P10-T02). Amounts are parsed to halalas on the server. */

const requestInternal = createAction<{ amount: string }, { id: string }>({
  name: "payout.request",
  schema: z.object({ amount: z.string().trim().min(1).max(20) }),
  auth: "required",
  handler: async ({ input, user }) => {
    if (user === null) throw validationFailed({ amount: ["INVALID_AMOUNT"] });
    let amountCents: number;
    try {
      amountCents = parseMoneyInput(input.amount, "SAR");
    } catch {
      throw validationFailed({ amount: ["INVALID_AMOUNT"] });
    }
    return requestPayout({ user, amountCents });
  },
});

export async function requestPayoutAction(input: unknown) {
  return requestInternal(input);
}
