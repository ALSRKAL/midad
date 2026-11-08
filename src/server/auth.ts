import "server-only";

import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { adminAc, userAc } from "better-auth/plugins/admin/access";

import { env, isGoogleOAuthEnabled } from "@/env";
import { db } from "@/server/db";
import { logger } from "@/server/logger";
import { enqueueEmail } from "@/server/email-queue";

/**
 * Better Auth configuration (P02-T01).
 *
 * Sessions live in the database (`Session` table), so banning a user can revoke access immediately
 * (BR-21) and "sign out everywhere" is a delete. The Prisma adapter maps Better Auth's required
 * tables (user/session/account/verification) onto the schema in prisma/schema.prisma; role, status,
 * locale and theme are declared as additional fields so they come back with the session.
 *
 * Google is registered only when both keys exist: the login button is hidden otherwise
 * (the product requirements), so there is no OAuth button that fails.
 */
export const auth = betterAuth({
  baseURL: env.APP_URL,
  secret: env.AUTH_SECRET,

  database: prismaAdapter(db, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
    // 8 characters minimum, checked again by the Zod schema on the form.
    minPasswordLength: 8,
    maxPasswordLength: 128,
    requireEmailVerification: true,
    // Reset tokens are single-use and short-lived (P02-T02).
    resetPasswordTokenExpiresIn: 60 * 60,
    sendResetPassword: async ({ user, url }) => {
      await enqueueEmail({
        to: user.email,
        template: "password_reset",
        locale: "ar",
        data: { name: user.name ?? user.email, url },
      });
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: false,
    expiresIn: 60 * 60 * 24,
    sendVerificationEmail: async ({ user, url }) => {
      await enqueueEmail({
        to: user.email,
        template: "email_verification",
        locale: "ar",
        data: { name: user.name ?? user.email, url },
      });
    },
  },

  socialProviders: isGoogleOAuthEnabled
    ? {
        google: {
          clientId: env.GOOGLE_CLIENT_ID ?? "",
          clientSecret: env.GOOGLE_CLIENT_SECRET ?? "",
        },
      }
    : {},

  user: {
    additionalFields: {
      // `role` and `banReason` are owned by Better Auth's admin plugin (impersonation, P05-T03).
      status: { type: "string", defaultValue: "ACTIVE", input: false },
      locale: { type: "string", defaultValue: "ar", input: true },
      theme: { type: "string", defaultValue: "SYSTEM", input: true },
      username: { type: "string", required: false, input: true },
      deletedAt: { type: "date", required: false, input: false },
    },
  },

  /**
   * BR-21: a banned or deleted account must not obtain a new session. The admin ban action in
   * P05-T03 deletes existing sessions; this hook is the second half — it stops the same account
   * from simply signing in again.
   */
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Welcome mail is queued, never sent inline: registration must not wait on SMTP.
          try {
            const locale = user.locale === "EN" ? "en" : "ar";
            await enqueueEmail({
              to: user.email,
              template: "welcome",
              locale,
              data: { name: user.name ?? user.email, url: `${env.APP_URL}/${locale}/courses` },
            });
          } catch (error) {
            logger.error({ err: error }, "welcome email enqueue failed");
          }
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          const account = await db.user.findUnique({
            where: { id: session.userId },
            select: { status: true, banReason: true },
          });
          if (account === null || account.status !== "ACTIVE") {
            throw new APIError("FORBIDDEN", {
              message:
                account?.status === "DELETED"
                  ? "ACCOUNT_DELETED: this account was deleted"
                  : "ACCOUNT_BANNED: this account is suspended",
            });
          }
          return { data: session };
        },
      },
    },
  },

  session: {
    // 30 days, refreshed once a day; a banned user's sessions are deleted, not left to expire (BR-21).
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: false },
  },

  /**
   * Authentication rate limiting (the product requirements). Better Auth applies it per IP and per endpoint;
   * the window and ceiling are environment variables so the functional E2E suite can raise the
   * ceiling while the default stays at the documented 5 requests per minute.
   */
  rateLimit: {
    enabled: true,
    window: env.AUTH_RATE_LIMIT_WINDOW_SEC,
    max: env.AUTH_RATE_LIMIT_MAX,
    /**
     * Better Auth ships tighter built-in rules for these paths, which would otherwise win over the
     * configured ceiling. Declaring them explicitly keeps one source of truth (the environment) and
     * documents the limits the product requirements asks for.
     */
    customRules: {
      "/sign-in/email": {
        window: env.AUTH_RATE_LIMIT_WINDOW_SEC,
        max: env.AUTH_RATE_LIMIT_MAX,
      },
      "/sign-up/email": {
        window: env.AUTH_RATE_LIMIT_WINDOW_SEC,
        max: env.AUTH_RATE_LIMIT_MAX,
      },
      "/request-password-reset": {
        window: env.AUTH_RATE_LIMIT_WINDOW_SEC,
        max: env.AUTH_RATE_LIMIT_MAX,
      },
      // The remaining auth writes §6.4 asks us to protect. They share the same ceiling and window
      // so an operator tunes one pair of environment variables, not five.
      "/send-verification-email": {
        window: env.AUTH_RATE_LIMIT_WINDOW_SEC,
        max: env.AUTH_RATE_LIMIT_MAX,
      },
      "/reset-password": {
        window: env.AUTH_RATE_LIMIT_WINDOW_SEC,
        max: env.AUTH_RATE_LIMIT_MAX,
      },
      "/change-password": {
        window: env.AUTH_RATE_LIMIT_WINDOW_SEC,
        max: env.AUTH_RATE_LIMIT_MAX,
      },
      "/sign-in/social": {
        window: env.AUTH_RATE_LIMIT_WINDOW_SEC,
        max: env.AUTH_RATE_LIMIT_MAX,
      },
    },
  },

  advanced: {
    database: { generateId: () => crypto.randomUUID() },
    cookiePrefix: "midad",
    // Secure cookies require HTTPS; WebKit correctly refuses them on the plain-HTTP E2E origin,
    // which silently dropped every session (P14-T01). Production APP_URL is always https.
    useSecureCookies: env.APP_URL.startsWith("https://"),
  },

  onAPIError: {
    onError: (error) => {
      logger.error({ err: error }, "auth api error");
    },
  },

  plugins: [
    admin({
      // Our roles are already STUDENT / INSTRUCTOR / ADMIN; the plugin must not invent "user".
      adminRoles: ["ADMIN"],
      defaultRole: "STUDENT",
      // The plugin authorises admin endpoints through this access-control map, not adminRoles.
      roles: { ADMIN: adminAc, INSTRUCTOR: userAc, STUDENT: userAc },
    }),
    // Must stay last: its after-hook forwards Set-Cookie headers into Next's cookie store.
    nextCookies(),
  ],
});

export type Auth = typeof auth;
