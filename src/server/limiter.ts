/**
 * Shared server-side rate limiter.
 *
 * `createAction` takes an injected limiter so its tests can use the in-memory implementation. The
 * application gets one Redis-backed singleton here: fixed-window counters survive process restarts
 * and are shared by every instance behind the load balancer.
 */

import "server-only";

import Redis from "ioredis";

import { env } from "@/env";
import { createRedisRateLimiter, type RateLimiter } from "@/server/rate-limit";

const globalForLimiter = globalThis as unknown as { midadLimiter?: RateLimiter };

function create(): RateLimiter {
  const redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 2,
    // Commands queue until the connection is ready. Without the queue, the first action after a
    // cold start fails with "Stream isn't writeable" even though Redis is healthy — observed while
    // testing the contact form in P03.
  });
  return createRedisRateLimiter(redis, "midad:rl");
}

export const rateLimiter: RateLimiter = globalForLimiter.midadLimiter ?? create();

if (env.NODE_ENV !== "production") globalForLimiter.midadLimiter = rateLimiter;
