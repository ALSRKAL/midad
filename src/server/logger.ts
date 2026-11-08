/**
 * Structured logging (pino).
 *
 * One logger per process, with a child logger per request carrying a `requestId`. Sensitive keys are
 * redacted centrally so a careless `logger.info({ user })` cannot write a password hash or a token
 * to disk. In development the output is pretty-printed; in production it stays JSON for log shipping.
 */

import pino, { type Logger } from "pino";

import { env } from "@/env";

const redactPaths = [
  "password",
  "passwordHash",
  "token",
  "accessToken",
  "refreshToken",
  "idToken",
  "authorization",
  "cookie",
  "secret",
  "apiKey",
  "*.password",
  "*.token",
  "req.headers.authorization",
  "req.headers.cookie",
];

export const logger: Logger = pino({
  level: env.LOG_LEVEL,
  base: { service: "midad", env: env.NODE_ENV },
  redact: { paths: redactPaths, censor: "[redacted]" },
  ...(env.NODE_ENV === "development"
    ? {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "HH:MM:ss", ignore: "pid,hostname" },
        },
      }
    : {}),
});

/** A child logger that tags every line with the request id shown to the user on failure. */
export function loggerForRequest(requestId: string): Logger {
  return logger.child({ requestId });
}

/** Generates the request id used in logs and in the generic 500 message. */
export function newRequestId(): string {
  return crypto.randomUUID();
}
