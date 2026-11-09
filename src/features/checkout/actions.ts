"use server";

import { z } from "zod";

import { unauthorized } from "@/lib/errors";
import { createAction } from "@/server/action";
import { startCheckout } from "@/server/checkout";
import { rateLimiter } from "@/server/limiter";

/** Starts a Stripe Checkout session for the server-recomputed cart (P06-T04). */

const startInternal = createAction<{ locale: "ar" | "en" }, { orderId: string; url: string }>({
  name: "checkout.start",
  schema: z.object({ locale: z.enum(["ar", "en"]) }),
  auth: "required",
  rateLimit: {
    key: ({ user }) => `checkout:${user?.id ?? "anonymous"}`,
    limit: 10,
    windowSec: 3600,
    limiter: rateLimiter,
  },
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    return startCheckout(user, input.locale);
  },
});

export async function startCheckoutAction(input: unknown) {
  return startInternal(input);
}
