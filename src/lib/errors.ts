/**
 * Application error taxonomy (the product requirements).
 *
 * Every failure the UI can show has an explicit kind, a translated message key and an HTTP status.
 * Anything unexpected becomes `INTERNAL` and is logged with the request id; its message never
 * reaches the user, because raw driver/database messages leak structure and are not actionable.
 */

export const APP_ERROR_KINDS = [
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "VALIDATION",
  "CONFLICT",
  "RATE_LIMITED",
  "PAYMENT",
  "INTERNAL",
] as const;

export type AppErrorKind = (typeof APP_ERROR_KINDS)[number];

/** Message keys live in messages/*.json under `errors.<kind>`. */
const STATUS_BY_KIND: Record<AppErrorKind, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION: 422,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  PAYMENT: 402,
  INTERNAL: 500,
};

export type FieldErrors = Record<string, string[]>;

export type AppErrorOptions = {
  /** For VALIDATION: field name -> message keys, rendered next to inputs. */
  fields?: FieldErrors;
  /** Safe, already-translated detail for the user (never a raw exception message). */
  detail?: string;
  /** Extra context for the log line only (never serialised to the client). */
  context?: Record<string, unknown>;
};

export class AppError extends Error {
  readonly kind: AppErrorKind;
  readonly status: number;
  readonly fields: FieldErrors | undefined;
  readonly detail: string | undefined;
  readonly context: Record<string, unknown> | undefined;
  /** Set by the action wrapper so a support conversation can reference it. */
  requestId: string | undefined;

  constructor(kind: AppErrorKind, message: string, options: AppErrorOptions = {}) {
    super(message);
    this.name = "AppError";
    this.kind = kind;
    this.status = STATUS_BY_KIND[kind];
    this.fields = options.fields;
    this.detail = options.detail;
    this.context = options.context;
  }

  get isClientFacing(): boolean {
    return this.kind !== "INTERNAL";
  }

  /** Translation key for the generic message: `errors.<kind>`. */
  get messageKey(): string {
    return `errors.${this.kind}`;
  }
}

/* Convenience constructors — used by actions and services so the kind is never a string literal. */

export const unauthorized = (message = "Authentication required") =>
  new AppError("UNAUTHORIZED", message);

export const forbidden = (message = "Not allowed") => new AppError("FORBIDDEN", message);

export const notFound = (message = "Not found") => new AppError("NOT_FOUND", message);

export const validationFailed = (fields: FieldErrors, message = "Invalid input") =>
  new AppError("VALIDATION", message, { fields });

export const conflict = (message: string) => new AppError("CONFLICT", message);

export const rateLimited = (retryAfterSeconds: number) =>
  new AppError("RATE_LIMITED", "Too many requests", {
    context: { retryAfterSeconds },
  });

export const paymentFailed = (message = "Payment failed") => new AppError("PAYMENT", message);

export const internal = (message = "Unexpected error", context?: Record<string, unknown>) =>
  new AppError("INTERNAL", message, context === undefined ? {} : { context });

/**
 * Normalises anything thrown into an AppError without leaking internals.
 *
 * The original message goes into `context`, which is logged but never serialised to the client:
 * a Postgres error such as `relation "courses" does not exist` tells an attacker about the schema
 * and tells a user nothing useful.
 */
export function toAppError(thrown: unknown): AppError {
  if (thrown instanceof AppError) return thrown;
  if (thrown instanceof Error) {
    return internal("Unexpected error", { reason: thrown.message, name: thrown.name });
  }
  return internal("Non-error value thrown", { reason: String(thrown) });
}

/** Error shape that crosses the server/client boundary. Never contains a stack or SQL. */
export type SerializedError = {
  kind: AppErrorKind;
  message: string;
  fields?: FieldErrors;
  detail?: string;
  requestId?: string;
};

export function serializeError(error: AppError): SerializedError {
  const base: SerializedError = { kind: error.kind, message: error.message };
  if (error.fields !== undefined) base.fields = error.fields;
  if (error.detail !== undefined) base.detail = error.detail;
  if (error.requestId !== undefined) base.requestId = error.requestId;
  return base;
}
