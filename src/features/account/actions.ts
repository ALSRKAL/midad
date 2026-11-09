"use server";

import { z } from "zod";

import { unauthorized, validationFailed } from "@/lib/errors";
import {
  deleteAccount,
  revokeAllSessions,
  revokeOtherSessions,
  revokeSession,
  saveAvatar,
  updateNotifications,
  updateProfile,
} from "@/server/account";
import { createAction } from "@/server/action";
import { getCurrentSessionWithId } from "@/server/session";

import {
  avatarSchema,
  deleteAccountSchema,
  notificationPreferencesSchema,
  profileSchema,
  revokeSessionSchema,
  type ProfileInput,
  type UserPreferences,
} from "./schema";

/**
 * Account settings actions (the product requirements).
 *
 * Every mutation goes through `createAction`, so the fixed order (validate → session → service)
 * applies to all of them. The handlers receive a user only after the wrapper proved the account is
 * active; the explicit null checks below keep that fact visible to TypeScript.
 */

const updateProfileInternal = createAction<ProfileInput, { saved: true }>({
  name: "account.updateProfile",
  schema: profileSchema,
  auth: "required",
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    await updateProfile(user.id, input);
    return { saved: true };
  },
});

export async function updateProfileAction(input: unknown) {
  return updateProfileInternal(input);
}

const updateAvatarInternal = createAction<{ avatar: File }, { image: string }>({
  name: "account.updateAvatar",
  schema: avatarSchema,
  auth: "required",
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    return saveAvatar(user.id, input.avatar);
  },
});

export async function updateAvatarAction(input: unknown) {
  return updateAvatarInternal(input);
}

const updateNotificationsInternal = createAction<UserPreferences, { saved: true }>({
  name: "account.updateNotifications",
  schema: notificationPreferencesSchema,
  auth: "required",
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    await updateNotifications(user.id, input);
    return { saved: true };
  },
});

export async function updateNotificationsAction(input: unknown) {
  return updateNotificationsInternal(input);
}

const revokeSessionInternal = createAction<{ sessionId: string }, { revoked: true }>({
  name: "account.revokeSession",
  schema: revokeSessionSchema,
  auth: "required",
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    await revokeSession(user.id, input.sessionId);
    return { revoked: true };
  },
});

export async function revokeSessionAction(input: unknown) {
  return revokeSessionInternal(input);
}

const revokeOtherSessionsInternal = createAction<Record<string, never>, { revoked: true }>({
  name: "account.revokeOtherSessions",
  schema: z.object({}),
  auth: "required",
  handler: async ({ user }) => {
    if (user === null) throw unauthorized();
    const current = await getCurrentSessionWithId();
    if (current === null) throw unauthorized();
    await revokeOtherSessions(user.id, current.sessionId);
    return { revoked: true };
  },
});

/** The trigger sends no fields; the empty object keeps `createAction`'s Zod step honest. */
export async function revokeOtherSessionsAction() {
  return revokeOtherSessionsInternal({});
}

const revokeAllSessionsInternal = createAction<Record<string, never>, { revoked: true }>({
  name: "account.revokeAllSessions",
  schema: z.object({}),
  auth: "required",
  handler: async ({ user }) => {
    if (user === null) throw unauthorized();
    await revokeAllSessions(user.id);
    return { revoked: true };
  },
});

export async function revokeAllSessionsAction() {
  return revokeAllSessionsInternal({});
}

const deleteAccountInternal = createAction<{ confirmEmail: string }, { deleted: true }>({
  name: "account.delete",
  schema: deleteAccountSchema,
  auth: "required",
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    // Typing the address is the confirmation §2.3 asks for: it cannot be done by a stray click.
    if (user.email.trim().toLowerCase() !== input.confirmEmail.trim().toLowerCase()) {
      throw validationFailed({ confirmEmail: ["EMAIL_MISMATCH"] });
    }
    await deleteAccount(user.id);
    return { deleted: true };
  },
});

export async function deleteAccountAction(input: unknown) {
  return deleteAccountInternal(input);
}
