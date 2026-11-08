/**
 * The single entry point for every mutation (the product requirements).
 *
 * Order is fixed and not configurable, because skipping a step is how authorization bugs happen:
 *
 *   request id → Zod validation → session → role → ownership (in the service) → rate limit →
 *   service call → revalidation → Result
 *
 * The action returns a `Result`; it never throws to the client. Unexpected exceptions are logged with
 * the request id and replaced by a generic INTERNAL message, so a stack trace or a SQL error can
 * never reach the browser.
 */

import { headers } from "next/headers";
import type { Logger } from "pino";
import type { ZodType } from "zod";

import type { Role } from "@/config/site";
import {
  AppError,
  forbidden,
  internal,
  rateLimited,
  serializeError,
  toAppError,
  unauthorized,
  type SerializedError,
} from "@/lib/errors";
import { err, ok, type Result } from "@/lib/result";
import { loggerForRequest, newRequestId } from "@/server/logger";
import type { RateLimiter } from "@/server/rate-limit";
import { getCurrentSession, type SessionUser } from "@/server/session";

export type ActionContext<TInput> = {
  input: TInput;
  user: SessionUser | null;
  requestId: string;
  /** Best-effort client address from the proxy headers; `unknown` outside a request context. */
  ip: string;
  log: Logger;
};

export type ActionOptions<TInput> = {
  /** Stable label used in logs, e.g. "updateCourse". */
  name: string;
  schema: ZodType<TInput>;
  /** When present, a signed-in user with this role is required. */
  roles?: readonly Role[];
  /** Defaults to "required" when `roles` is set, otherwise "optional". */
  auth?: "required" | "optional";
  rateLimit?: {
    /** Builds the counter key, e.g. `login:${ip}` or `coupon:${userId}`. */
    key: (context: { input: TInput; user: SessionUser | null; ip: string }) => string;
    limit: number;
    windowSec: number;
    /** Injected in tests; the app uses a Redis-backed limiter. */
    limiter?: RateLimiter;
  };
  /** Paths to revalidate after a successful mutation. */
  revalidate?: string[];
  handler: (context: ActionContext<TInput>) => Promise<unknown>;
};

export type Action<TOutput> = (rawInput: unknown) => Promise<Result<TOutput, SerializedError>>;

/** Accepts plain objects and `FormData` (React Hook Form + server actions). */
function readInput(raw: unknown): unknown {
  if (typeof FormData !== "undefined" && raw instanceof FormData) {
    const collected = new Map<string, unknown[]>();
    for (const [key, value] of raw.entries()) {
      const list = collected.get(key) ?? [];
      list.push(value);
      collected.set(key, list);
    }
    // A single value stays scalar; repeated keys become an array instead of silently keeping the last.
    return Object.fromEntries(
      [...collected.entries()].map(([key, values]) => [
        key,
        values.length === 1 ? values[0] : values,
      ]),
    );
  }
  return raw;
}

async function clientIp(): Promise<string> {
  try {
    const requestHeaders = await headers();
    const forwarded = requestHeaders.get("x-forwarded-for");
    return forwarded?.split(",")[0]?.trim() ?? requestHeaders.get("x-real-ip") ?? "unknown";
  } catch {
    // Unit tests call actions outside a request; they use the memory limiter and an "unknown" bucket.
    return "unknown";
  }
}

export function createAction<TInput, TOutput>(options: ActionOptions<TInput>): Action<TOutput> {
  return async (rawInput: unknown): Promise<Result<TOutput, SerializedError>> => {
    const requestId = newRequestId();
    const log = loggerForRequest(requestId);
    const ip = await clientIp();

    try {
      /* 1. Validate before touching the database or the session. */
      const parsed = options.schema.safeParse(readInput(rawInput));
      if (!parsed.success) {
        const fields: Record<string, string[]> = {};
        for (const issue of parsed.error.issues) {
          const path = issue.path.join(".") || "form";
          (fields[path] ??= []).push(issue.message);
        }
        return err(
          serializeError(
            new AppError("VALIDATION", "Invalid input", {
              fields,
            }),
          ),
        );
      }
      const input = parsed.data;

      /* 2. Session. */
      const user = await getCurrentSession();
      const requiresAuth = options.auth === "required" || options.roles !== undefined;

      if (requiresAuth && user === null) return err(serializeError(unauthorized()));
      if (user !== null && user.status !== "ACTIVE") {
        return err(serializeError(forbidden("This account is not active")));
      }

      /* 3. Role. */
      if (options.roles !== undefined) {
        if (user === null) return err(serializeError(unauthorized()));
        if (!options.roles.includes(user.role)) {
          log.warn({ action: options.name, userId: user.id, role: user.role }, "role rejected");
          return err(serializeError(forbidden()));
        }
      }

      /* 4. Rate limit, after auth so anonymous traffic cannot exhaust a signed-in user's bucket. */
      if (options.rateLimit !== undefined) {
        const limiter = options.rateLimit.limiter;
        if (limiter === undefined) {
          throw internal("A rate limiter must be configured for this action");
        }
        const key = options.rateLimit.key({ input, user, ip });
        const result = await limiter.consume(
          key,
          options.rateLimit.limit,
          options.rateLimit.windowSec,
        );
        if (!result.allowed) {
          log.warn({ key, limit: result.limit }, "rate limited");
          const limited = rateLimited(result.retryAfterSec);
          return err(serializeError(limited));
        }
      }

      /* 5. Service call. */
      const value = (await options.handler({ input, user, requestId, ip, log })) as TOutput;

      /* 6. Cache invalidation only on success. Imported lazily so pure tooling and unit tests do not
         need the Next.js request store. */
      const pathsToRevalidate = options.revalidate ?? [];
      if (pathsToRevalidate.length > 0) {
        const { revalidatePath } = await import("next/cache");
        for (const path of pathsToRevalidate) revalidatePath(path);
      }

      return ok(value);
    } catch (thrown) {
      const appError = toAppError(thrown);

      if (appError.kind === "INTERNAL") {
        log.error({ err: thrown }, "unhandled action failure");
      } else {
        log.info({ kind: appError.kind, detail: appError.detail }, "action rejected");
      }

      appError.requestId = requestId;
      return err(serializeError(appError));
    }
  };
}
