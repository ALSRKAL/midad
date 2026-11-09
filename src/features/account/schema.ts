/**
 * Validation for the account settings forms (the product requirements).
 *
 * Messages are stable codes, not prose: the client translates them into the active language, so an
 * error raised on the server still appears in Arabic on an Arabic page. Any message without a
 * translation falls back to a generic translated error rather than leaking English or internals.
 */

import { z } from "zod";

export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "NAME_TOO_SHORT" })
    .max(80, { message: "NAME_TOO_LONG" }),
  bio: z.string().trim().max(500, { message: "BIO_TOO_LONG" }).optional(),
  locale: z.enum(["ar", "en"], { message: "INVALID_LOCALE" }),
  theme: z.enum(["light", "dark", "system"], { message: "INVALID_THEME" }),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export const notificationPreferencesSchema = z.object({
  notifyReplies: z.boolean(),
  notifyAnnouncements: z.boolean(),
  notifyProductUpdates: z.boolean(),
});

export type UserPreferences = z.infer<typeof notificationPreferencesSchema>;

export const avatarSchema = z.object({
  avatar: z.instanceof(File, { message: "AVATAR_REQUIRED" }),
});

export const revokeSessionSchema = z.object({
  sessionId: z.string().min(1, { message: "SESSION_REQUIRED" }),
});

export const deleteAccountSchema = z.object({
  confirmEmail: z.string().trim().min(1, { message: "CONFIRM_REQUIRED" }),
});
