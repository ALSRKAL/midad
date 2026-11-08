/**
 * Session access for every action, query and route handler.
 *
 * Reads the Better Auth session from the request and maps it onto the small `SessionUser` shape the
 * rest of the code depends on, so no module outside this file knows about Better Auth's types.
 *
 * A banned or soft-deleted account is treated as *no session*, which is what makes BR-21 work: the
 * ban also deletes the session rows, and this guard catches the case where a stale cookie arrives
 * before the delete commits.
 */

import "server-only";

import { headers } from "next/headers";

import type { Locale, Role } from "@/config/site";
import { auth } from "@/server/auth";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "ACTIVE" | "BANNED" | "DELETED";
  locale: Locale;
  emailVerified: boolean;
  /** Admin id when this session was created through impersonation (P05-T03). */
  impersonatedBy: string | null;
};

type AuthUserLike = {
  id: string;
  name: string;
  email: string;
  role?: string | null | undefined;
  status?: string | null | undefined;
  locale?: string | null | undefined;
  emailVerified?: boolean | null | undefined;
};

/** Normalises Better Auth's user row into the app's contract, defaulting safely. */
export function toSessionUser(user: AuthUserLike): SessionUser {
  // The database stores Prisma enums in upper case ("ADMIN", "AR"); normalise once here so callers
  // never have to remember which casing they are holding.
  const roleValue = (user.role ?? "").toUpperCase();
  const statusValue = (user.status ?? "").toUpperCase();
  const role: Role = roleValue === "ADMIN" || roleValue === "INSTRUCTOR" ? roleValue : "STUDENT";
  const status =
    statusValue === "BANNED" || statusValue === "DELETED" ? statusValue : ("ACTIVE" as const);
  const locale: Locale = (user.locale ?? "").toLowerCase() === "en" ? "en" : "ar";

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role,
    status,
    locale,
    emailVerified: user.emailVerified ?? false,
    impersonatedBy: null,
  };
}

export async function getCurrentSession(): Promise<SessionUser | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session === null) return null;

  const user = toSessionUser(session.user);
  if (user.status !== "ACTIVE") return null;
  return { ...user, impersonatedBy: session.session.impersonatedBy ?? null };
}

export type CurrentSession = {
  user: SessionUser;
  /** Session row id, used to tell the current session apart from the others in settings. */
  sessionId: string;
};

/**
 * Same contract as `getCurrentSession`, plus the session row id.
 *
 * Only the account settings page and its "sign out other sessions" action need the id; keeping it
 * in a separate function means the common path cannot accidentally depend on it.
 */
export async function getCurrentSessionWithId(): Promise<CurrentSession | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session === null) return null;

  const user = toSessionUser(session.user);
  if (user.status !== "ACTIVE") return null;
  return {
    user: { ...user, impersonatedBy: session.session.impersonatedBy ?? null },
    sessionId: session.session.id,
  };
}
