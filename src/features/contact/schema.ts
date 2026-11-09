/** Contact form validation (the product requirements). Messages are codes the client translates. */

import { z } from "zod";

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "NAME_TOO_SHORT" })
    .max(80, { message: "NAME_TOO_LONG" }),
  email: z.email({ message: "EMAIL_INVALID" }).max(160),
  subject: z
    .string()
    .trim()
    .min(4, { message: "SUBJECT_TOO_SHORT" })
    .max(120, { message: "SUBJECT_TOO_LONG" }),
  message: z
    .string()
    .trim()
    .min(20, { message: "MESSAGE_TOO_SHORT" })
    .max(2000, { message: "MESSAGE_TOO_LONG" }),
  /** Honeypot: a hidden field humans never fill. Any content means a bot. */
  website: z.string().max(200).optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;
