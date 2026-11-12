import { describe, expect, it } from "vitest";

import {
  AppError,
  conflict,
  forbidden,
  internal,
  notFound,
  rateLimited,
  serializeError,
  toAppError,
  unauthorized,
  validationFailed,
} from "@/lib/errors";
import { err, isErr, isOk, mapResult, ok, unwrap } from "@/lib/result";

describe("Result", () => {
  it("carries a success value", () => {
    const result = ok(42);
    expect(result.ok).toBe(true);
    expect(isOk(result)).toBe(true);
    expect(isErr(result)).toBe(false);
  });

  it("carries a failure value", () => {
    const result = err({ code: "NOPE" });
    expect(result.ok).toBe(false);
    expect(isErr(result)).toBe(true);
  });

  it("maps a success and leaves a failure untouched", () => {
    expect(mapResult(ok(2), (value) => value * 3)).toEqual({ ok: true, value: 6 });

    const failure = err("bad");
    expect(mapResult(failure, (value: number) => value * 3)).toBe(failure);
  });

  it("unwraps a success and throws on a failure", () => {
    expect(unwrap(ok("value"))).toBe("value");
    expect(() => unwrap(err("bad"))).toThrow(/failed Result/);
  });
});

describe("AppError", () => {
  it("maps every kind to its HTTP status", () => {
    expect(unauthorized().status).toBe(401);
    expect(forbidden().status).toBe(403);
    expect(notFound().status).toBe(404);
    expect(validationFailed({ email: ["invalid"] }).status).toBe(422);
    expect(conflict("duplicate").status).toBe(409);
    expect(rateLimited(30).status).toBe(429);
    expect(internal().status).toBe(500);
  });

  it("gives each kind a translation key", () => {
    expect(notFound().messageKey).toBe("errors.NOT_FOUND");
    expect(forbidden().messageKey).toBe("errors.FORBIDDEN");
  });

  it("keeps field errors for validation", () => {
    const error = validationFailed({ email: ["errors.email"], password: ["errors.short"] });
    expect(error.fields).toEqual({ email: ["errors.email"], password: ["errors.short"] });
  });

  it("marks only INTERNAL as not client-facing", () => {
    expect(internal().isClientFacing).toBe(false);
    expect(validationFailed({}).isClientFacing).toBe(true);
    expect(notFound().isClientFacing).toBe(true);
  });

  it("serialises without stack, context or internals", () => {
    const error = new AppError("VALIDATION", "Invalid input", {
      fields: { email: ["errors.email"] },
      detail: "safe detail",
      context: { sql: "SELECT secret" },
    });
    error.requestId = "req-1";

    const serialized = serializeError(error);
    expect(serialized).toEqual({
      kind: "VALIDATION",
      message: "Invalid input",
      fields: { email: ["errors.email"] },
      detail: "safe detail",
      requestId: "req-1",
    });
    expect("context" in serialized).toBe(false);
    expect("stack" in serialized).toBe(false);
  });

  it("normalises an unexpected exception into INTERNAL", () => {
    const error = toAppError(new Error("relation does not exist"));
    expect(error.kind).toBe("INTERNAL");
    expect(error.status).toBe(500);
  });

  it("passes an AppError through unchanged", () => {
    const original = forbidden("nope");
    expect(toAppError(original)).toBe(original);
  });

  it("normalises a thrown non-error", () => {
    expect(toAppError("boom").kind).toBe("INTERNAL");
  });
});
