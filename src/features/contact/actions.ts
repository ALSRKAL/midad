"use server";

import { createAction } from "@/server/action";
import { db } from "@/server/db";
import { rateLimiter } from "@/server/limiter";

import { contactSchema, type ContactInput } from "./schema";

/**
 * Contact form submission (the product requirements, §6.4).
 *
 * Stored in `contact_messages`, which the admin inbox reads from P05 onward. No account is needed,
 * so the action is public — and therefore rate-limited per sender address (three messages per ten
 * minutes) and protected by a honeypot. A honeypot hit reports success to the bot but stores nothing,
 * so the sender learns nothing about the filter.
 */

const submitInternal = createAction<ContactInput, { sent: true }>({
  name: "contact.submit",
  schema: contactSchema,
  auth: "optional",
  rateLimit: {
    key: ({ input }) => `contact:${input.email.trim().toLowerCase()}`,
    limit: 3,
    windowSec: 600,
    limiter: rateLimiter,
  },
  handler: async ({ input, log }) => {
    if (input.website !== undefined && input.website.trim() !== "") {
      log.info({ reason: "honeypot" }, "contact submission discarded");
      return { sent: true };
    }

    await db.contactMessage.create({
      data: {
        name: input.name,
        email: input.email.trim().toLowerCase(),
        subject: input.subject,
        message: input.message,
      },
    });

    return { sent: true };
  },
});

export async function submitContactMessageAction(input: unknown) {
  return submitInternal(input);
}
