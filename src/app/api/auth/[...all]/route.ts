import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/server/auth";

/**
 * Better Auth's own endpoints (sign-up, sign-in, verification, reset, session).
 *
 * This is a Route Handler rather than a Server Action because the library owns the cookie and
 * redirect semantics; everything else in the product still goes through `createAction`.
 *
 * Better Auth returns its wait time as `X-Retry-After`. The HTTP standard for a 429 is
 * `Retry-After`, and clients/proxies honour that one, so it is mirrored here without dropping the
 * library's header.
 */

const handlers = toNextJsHandler(auth);

function withStandardRetryAfter(response: Response): Response {
  const retryAfter = response.headers.get("x-retry-after");
  if (response.status !== 429 || retryAfter === null || response.headers.has("retry-after")) {
    return response;
  }

  const headers = new Headers(response.headers);
  headers.set("Retry-After", retryAfter);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function GET(request: Request): Promise<Response> {
  return withStandardRetryAfter(await handlers.GET(request));
}

export async function POST(request: Request): Promise<Response> {
  return withStandardRetryAfter(await handlers.POST(request));
}
