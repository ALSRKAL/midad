/**
 * Server-side authorization (the product requirements).
 *
 * The middleware only routes; every decision about *who may do what* happens here, next to the data.
 * `createAction` calls these helpers, and so must every query that reads a resource belonging to a
 * user. They throw `AppError`, so callers cannot forget to return a failure.
 *
 * `requireRole` is intentionally strict: an anonymous visitor gets UNAUTHORIZED, a signed-in user
 * with the wrong role gets FORBIDDEN, and a banned account gets FORBIDDEN even if its role matches.
 */

import "server-only";

import type { Role } from "@/config/site";
import { AppError, forbidden, notFound, unauthorized } from "@/lib/errors";
import { getCurrentSession, type SessionUser } from "@/server/session";

export function requireUser(user: SessionUser | null): SessionUser {
  if (user === null) throw unauthorized();
  if (user.status !== "ACTIVE") throw forbidden("This account is not active");
  return user;
}

export function requireRole(user: SessionUser | null, roles: readonly Role[]): SessionUser {
  const active = requireUser(user);
  // ADMIN is a superuser: the platform description gives it "everything", so a check written for
  // instructors must not accidentally lock an admin out.
  if (active.role !== "ADMIN" && !roles.includes(active.role)) {
    throw forbidden(`Requires one of: ${roles.join(", ")}`);
  }
  return active;
}

export const requireAdmin = (user: SessionUser | null): SessionUser => requireRole(user, ["ADMIN"]);

export const requireInstructor = (user: SessionUser | null): SessionUser =>
  requireRole(user, ["INSTRUCTOR", "ADMIN"]);

export async function requireSession(): Promise<SessionUser> {
  return requireUser(await getCurrentSession());
}

export async function requireRoleForRequest(roles: readonly Role[]): Promise<SessionUser> {
  return requireRole(await getCurrentSession(), roles);
}

/**
 * Ownership check for a resource (BR-01…BR-21 all depend on it): a missing resource and a resource
 * owned by someone else both produce NOT_FOUND, so an attacker cannot probe which ids exist.
 */
export function assertOwnership(
  ownerId: string | null | undefined,
  actorId: string,
  options: { allowAdmin?: boolean; actorRole?: Role } = {},
): void {
  if (options.allowAdmin === true && options.actorRole === "ADMIN") return;
  if (ownerId === null || ownerId === undefined) throw notFound();
  if (ownerId !== actorId) throw notFound();
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Converts an authorization failure into the HTTP status a route handler or page should use.
 * Kept here so a page and an action cannot disagree about what FORBIDDEN means.
 */
export function statusForError(error: unknown): number {
  return isAppError(error) ? error.status : 500;
}
