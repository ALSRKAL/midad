/**
 * Instructor application validation (the product requirements).
 *
 * Messages are codes translated by the client. Links must be absolute http(s) URLs — a bare domain
 * or a `javascript:` URL is rejected before it can be stored and later rendered to an admin.
 */

import { z } from "zod";

const httpUrl = z
  .string()
  .trim()
  .max(500, { message: "URL_TOO_LONG" })
  .refine(
    (value) => {
      try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "URL_INVALID" },
  );

export const instructorApplicationSchema = z.object({
  experience: z
    .string()
    .trim()
    .min(50, { message: "EXPERIENCE_TOO_SHORT" })
    .max(2000, { message: "EXPERIENCE_TOO_LONG" }),
  field: z
    .string()
    .trim()
    .min(2, { message: "FIELD_REQUIRED" })
    .max(120, { message: "FIELD_TOO_LONG" }),
  portfolioUrl: z.union([z.literal(""), httpUrl]).optional(),
  sampleVideoUrl: z.union([z.literal(""), httpUrl]).optional(),
});

export type InstructorApplicationInput = z.infer<typeof instructorApplicationSchema>;
