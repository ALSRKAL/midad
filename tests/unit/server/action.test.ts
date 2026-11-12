import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import type { Role } from "@/config/site";
import { validationFailed } from "@/lib/errors";
import { createAction, type ActionContext, type ActionOptions } from "@/server/action";
import { createMemoryRateLimiter } from "@/server/rate-limit";
import type { SessionUser } from "@/server/session";

/**
 * The action wrapper is the security boundary of every mutation, so its pipeline is tested end to
 * end with a fake session: validation, authentication, role, rate limiting, success and the
 * unexpected-error path. `getCurrentSession` is the only thing mocked; everything else is real.
 */

const sessionMock = vi.hoisted(() => ({ current: null as SessionUser | null }));

vi.mock("@/server/session", () => ({
  getCurrentSession: () => Promise.resolve(sessionMock.current),
}));

const student: SessionUser = {
  id: "user_student",
  name: "Reem",
  email: "student@midad.test",
  role: "STUDENT",
  status: "ACTIVE",
  locale: "ar",
  emailVerified: true,
  impersonatedBy: null,
};

const admin: SessionUser = { ...student, id: "user_admin", role: "ADMIN" };
const banned: SessionUser = { ...student, id: "user_banned", status: "BANNED" };

/**
 * Fields that arrive through FormData are strings, so schemas used by progressive-enhancement forms
 * declare coercion explicitly; a JSON-only action can use `z.number()` directly.
 */
const inputSchema = z.object({
  title: z.string().min(3),
  priceCents: z.coerce.number().int().nonnegative(),
});

type TestInput = z.infer<typeof inputSchema>;

type Overrides = {
  handler?: (context: ActionContext<TestInput>) => Promise<unknown>;
  roles?: readonly Role[];
  auth?: ActionOptions<TestInput>["auth"];
  rateLimit?: ActionOptions<TestInput>["rateLimit"];
};

function buildAction(overrides: Overrides = {}) {
  return createAction<TestInput, unknown>({
    name: "testAction",
    schema: inputSchema,
    handler: overrides.handler ?? (() => Promise.resolve("default")),
    ...(overrides.roles === undefined ? {} : { roles: overrides.roles }),
    ...(overrides.auth === undefined ? {} : { auth: overrides.auth }),
    ...(overrides.rateLimit === undefined ? {} : { rateLimit: overrides.rateLimit }),
  });
}

beforeEach(() => {
  sessionMock.current = null;
});

describe("createAction validation", () => {
  it("rejects invalid input with per-field messages and never calls the handler", async () => {
    let called = false;
    const action = buildAction({
      handler: () => {
        called = true;
        return Promise.resolve("should not run");
      },
    });

    const result = await action({ title: "ab", priceCents: 100 });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.kind).toBe("VALIDATION");
    expect(result.error.fields?.title).toBeDefined();
    expect(called).toBe(false);
  });

  it("accepts FormData from a progressive-enhancement form", async () => {
    sessionMock.current = student;
    const action = buildAction({
      handler: ({ input }) => Promise.resolve({ saved: input.title }),
    });

    const formData = new FormData();
    formData.set("title", "دورة جديدة");
    formData.set("priceCents", "19900");

    expect(await action(formData)).toEqual({ ok: true, value: { saved: "دورة جديدة" } });
  });

  it("keeps repeated FormData keys as an array instead of dropping values", async () => {
    sessionMock.current = student;
    const action = createAction<{ tags: string[] }, unknown>({
      name: "tagsAction",
      schema: z.object({ tags: z.array(z.string()) }),
      handler: ({ input }) => Promise.resolve(input.tags),
    });

    const formData = new FormData();
    formData.append("tags", "a");
    formData.append("tags", "b");

    expect(await action(formData)).toEqual({ ok: true, value: ["a", "b"] });
  });
});

describe("createAction authentication", () => {
  it("returns UNAUTHORIZED when auth is required and there is no session", async () => {
    const action = buildAction({ auth: "required" });
    const result = await action({ title: "valid", priceCents: 0 });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.kind).toBe("UNAUTHORIZED");
  });

  it("allows an anonymous call when auth is optional", async () => {
    const action = buildAction({ auth: "optional" });
    expect((await action({ title: "valid", priceCents: 0 })).ok).toBe(true);
  });

  it("rejects a banned account even with a valid session", async () => {
    sessionMock.current = banned;
    const action = buildAction({ auth: "required" });
    const result = await action({ title: "valid", priceCents: 0 });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.kind).toBe("FORBIDDEN");
  });
});

describe("createAction roles", () => {
  it("rejects a signed-in user without the required role", async () => {
    sessionMock.current = student;
    const action = buildAction({ roles: ["ADMIN"] });
    const result = await action({ title: "valid", priceCents: 0 });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.kind).toBe("FORBIDDEN");
  });

  it("requires a session whenever roles are declared", async () => {
    const action = buildAction({ roles: ["ADMIN"] });
    const result = await action({ title: "valid", priceCents: 0 });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.kind).toBe("UNAUTHORIZED");
  });

  it("allows a matching role and passes the user to the handler", async () => {
    sessionMock.current = admin;
    const action = buildAction({
      roles: ["ADMIN"],
      handler: ({ user }) => Promise.resolve(user?.id ?? "none"),
    });

    expect(await action({ title: "valid", priceCents: 0 })).toEqual({
      ok: true,
      value: "user_admin",
    });
  });
});

describe("createAction rate limiting", () => {
  it("blocks after the limit and reports RATE_LIMITED", async () => {
    sessionMock.current = student;
    const limiter = createMemoryRateLimiter(() => 0);
    const action = buildAction({
      rateLimit: { key: () => "test:student", limit: 2, windowSec: 60, limiter },
    });

    expect((await action({ title: "valid", priceCents: 0 })).ok).toBe(true);
    expect((await action({ title: "valid", priceCents: 0 })).ok).toBe(true);

    const third = await action({ title: "valid", priceCents: 0 });
    expect(third.ok).toBe(false);
    if (third.ok) return;
    expect(third.error.kind).toBe("RATE_LIMITED");
  });

  it("does not run the handler when the limiter blocks", async () => {
    sessionMock.current = student;
    let calls = 0;
    const limiter = createMemoryRateLimiter(() => 0);
    const action = buildAction({
      handler: () => {
        calls += 1;
        return Promise.resolve("ran");
      },
      rateLimit: { key: () => "k", limit: 1, windowSec: 60, limiter },
    });

    await action({ title: "valid", priceCents: 0 });
    await action({ title: "valid", priceCents: 0 });

    expect(calls).toBe(1);
  });
});

describe("createAction failure mapping", () => {
  it("turns an unexpected exception into INTERNAL without leaking the original message", async () => {
    sessionMock.current = student;
    const action = buildAction({
      handler: () => Promise.reject(new Error('relation "courses" does not exist')),
    });

    const result = await action({ title: "valid", priceCents: 0 });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.kind).toBe("INTERNAL");
    expect(result.error.message).toBe("Unexpected error");
    expect(result.error.requestId).toMatch(/[0-9a-f-]{36}/);
    expect(JSON.stringify(result.error)).not.toContain("courses");
  });

  it("passes a known AppError through with its fields intact", async () => {
    sessionMock.current = student;
    const action = buildAction({
      handler: () => Promise.reject(validationFailed({ title: ["errors.title_taken"] })),
    });

    const result = await action({ title: "valid", priceCents: 0 });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.kind).toBe("VALIDATION");
    expect(result.error.fields).toEqual({ title: ["errors.title_taken"] });
  });
});
