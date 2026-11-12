import { describe, expect, it, vi } from "vitest";

import { AppError } from "@/lib/errors";
import {
  assertOwnership,
  requireAdmin,
  requireInstructor,
  requireRole,
  requireUser,
  statusForError,
} from "@/server/rbac";
import type { SessionUser } from "@/server/session";

/**
 * The full access matrix (P02-T04). Every role is checked against every requirement, including the
 * banned and anonymous cases, because "instructor cannot reach admin" is as important as
 * "admin can reach admin" and is the one that gets forgotten.
 */

vi.mock("@/server/session", () => ({
  getCurrentSession: () => Promise.resolve(null),
}));

const base: SessionUser = {
  id: "u_1",
  name: "Test",
  email: "t@midad.test",
  role: "STUDENT",
  status: "ACTIVE",
  locale: "ar",
  emailVerified: true,
  impersonatedBy: null,
};

const student: SessionUser = { ...base };
const instructor: SessionUser = { ...base, id: "u_2", role: "INSTRUCTOR" };
const admin: SessionUser = { ...base, id: "u_3", role: "ADMIN" };
const bannedAdmin: SessionUser = { ...admin, id: "u_4", status: "BANNED" };

function expectError(run: () => unknown, kind: AppError["kind"]): void {
  try {
    run();
    expect.unreachable(`expected ${kind}`);
  } catch (error) {
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).kind).toBe(kind);
  }
}

describe("requireUser", () => {
  it("returns the user when active", () => {
    expect(requireUser(student).id).toBe("u_1");
  });

  it("rejects an anonymous visitor with UNAUTHORIZED", () => {
    expectError(() => requireUser(null), "UNAUTHORIZED");
  });

  it("rejects a banned user with FORBIDDEN", () => {
    expectError(() => requireUser(bannedAdmin), "FORBIDDEN");
  });
});

describe("requireRole matrix", () => {
  it("STUDENT passes a STUDENT requirement", () => {
    expect(requireRole(student, ["STUDENT"]).role).toBe("STUDENT");
  });

  it("STUDENT is denied INSTRUCTOR and ADMIN requirements", () => {
    expectError(() => requireRole(student, ["INSTRUCTOR"]), "FORBIDDEN");
    expectError(() => requireRole(student, ["ADMIN"]), "FORBIDDEN");
  });

  it("INSTRUCTOR passes INSTRUCTOR but is denied ADMIN", () => {
    expect(requireRole(instructor, ["INSTRUCTOR"]).role).toBe("INSTRUCTOR");
    expectError(() => requireRole(instructor, ["ADMIN"]), "FORBIDDEN");
  });

  it("ADMIN passes every requirement", () => {
    expect(requireRole(admin, ["ADMIN"]).role).toBe("ADMIN");
    expect(requireRole(admin, ["INSTRUCTOR"]).role).toBe("ADMIN");
    expect(requireRole(admin, ["STUDENT"]).role).toBe("ADMIN");
  });

  it("anonymous is UNAUTHORIZED for every requirement", () => {
    expectError(() => requireRole(null, ["STUDENT"]), "UNAUTHORIZED");
    expectError(() => requireRole(null, ["INSTRUCTOR"]), "UNAUTHORIZED");
    expectError(() => requireRole(null, ["ADMIN"]), "UNAUTHORIZED");
  });

  it("a banned admin is denied even with the matching role", () => {
    expectError(() => requireRole(bannedAdmin, ["ADMIN"]), "FORBIDDEN");
  });

  it("requireAdmin and requireInstructor enforce their own scopes", () => {
    expect(requireAdmin(admin).role).toBe("ADMIN");
    expectError(() => requireAdmin(instructor), "FORBIDDEN");

    expect(requireInstructor(instructor).role).toBe("INSTRUCTOR");
    expect(requireInstructor(admin).role).toBe("ADMIN");
    expectError(() => requireInstructor(student), "FORBIDDEN");
  });
});

describe("assertOwnership", () => {
  it("allows the owner", () => {
    expect(() => assertOwnership("u_1", "u_1")).not.toThrow();
  });

  it("treats another user's resource as NOT_FOUND, not FORBIDDEN", () => {
    // A 403 would confirm the id exists; NOT_FOUND reveals nothing (IDOR defence).
    expectError(() => assertOwnership("u_2", "u_1"), "NOT_FOUND");
  });

  it("treats a missing owner as NOT_FOUND", () => {
    expectError(() => assertOwnership(null, "u_1"), "NOT_FOUND");
    expectError(() => assertOwnership(undefined, "u_1"), "NOT_FOUND");
  });

  it("can let an admin through when the caller says so", () => {
    expect(() =>
      assertOwnership("u_2", "u_1", { allowAdmin: true, actorRole: "ADMIN" }),
    ).not.toThrow();
  });

  it("does not let a non-admin through the admin bypass", () => {
    expectError(
      () => assertOwnership("u_2", "u_1", { allowAdmin: true, actorRole: "INSTRUCTOR" }),
      "NOT_FOUND",
    );
  });
});

describe("statusForError", () => {
  it("maps AppError kinds to their HTTP status", () => {
    expect(statusForError(new AppError("UNAUTHORIZED", "x"))).toBe(401);
    expect(statusForError(new AppError("FORBIDDEN", "x"))).toBe(403);
    expect(statusForError(new AppError("NOT_FOUND", "x"))).toBe(404);
  });

  it("maps anything unknown to 500", () => {
    expect(statusForError(new Error("boom"))).toBe(500);
    expect(statusForError("nope")).toBe(500);
  });
});
