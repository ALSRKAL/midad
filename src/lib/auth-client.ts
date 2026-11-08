"use client";

import { createAuthClient } from "better-auth/react";
import { adminClient, inferAdditionalFields } from "better-auth/client/plugins";

import type { auth } from "@/server/auth";

/**
 * Browser-side auth client.
 *
 * Talks to `/api/auth/*` on the same origin, so the session cookie is first-party and no CORS or
 * token storage is involved. Kept in its own module so no server config can leak into the bundle.
 */
export const authClient = createAuthClient({
  baseURL: typeof window === "undefined" ? undefined : window.location.origin,
  // Makes the app's extra user fields (role, status, locale, theme, username) typed on the client
  // without duplicating their definition; the type import is erased at build time.
  plugins: [inferAdditionalFields<typeof auth>(), adminClient()],
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  sendVerificationEmail,
  requestPasswordReset,
  resetPassword,
  changePassword,
} = authClient;
