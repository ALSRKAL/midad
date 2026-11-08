/**
 * Rate limiting (the product requirements).
 *
 * Fixed-window counters in Redis, incremented atomically with a Lua script so two concurrent requests
 * cannot both read "4" and both be allowed. The interface is small on purpose: the action wrapper
 * depends on `RateLimiter`, so tests use an in-memory implementation and never need Redis.
 *
 * A fixed window allows a burst at a boundary; that is acceptable for the endpoints listed in the
 * prompt (login, register, forgot-password, contact, coupon, quiz submit) and far simpler than a
 * sliding log. The window length is short enough that the boundary burst is bounded.
 */

import type Redis from "ioredis";

export type RateLimitResult = {
  allowed: boolean;
  /** Requests left in the current window (0 when blocked). */
  remaining: number;
  /** Seconds until the window resets — sent as `Retry-After` when blocked. */
  retryAfterSec: number;
  limit: number;
};

export type RateLimiter = {
  consume(key: string, limit: number, windowSec: number): Promise<RateLimitResult>;
};

const INCREMENT_SCRIPT = `
local current = redis.call("INCR", KEYS[1])
if current == 1 then
  redis.call("EXPIRE", KEYS[1], ARGV[1])
end
local ttl = redis.call("TTL", KEYS[1])
return { current, ttl }
`;

export function createRedisRateLimiter(redis: Redis, prefix = "rl"): RateLimiter {
  return {
    async consume(key, limit, windowSec) {
      const [countRaw, ttlRaw] = (await redis.eval(
        INCREMENT_SCRIPT,
        1,
        `${prefix}:${key}`,
        windowSec,
      )) as [number, number];

      const count = Number(countRaw);
      const ttl = Math.max(0, Number(ttlRaw));

      return {
        allowed: count <= limit,
        remaining: Math.max(0, limit - count),
        retryAfterSec: count <= limit ? 0 : ttl,
        limit,
      };
    },
  };
}

/**
 * In-memory limiter for tests and single-process tooling. It is honest about its scope: a map with
 * expiry, not a distributed counter, so it must never be used in the app at runtime.
 */
export function createMemoryRateLimiter(now: () => number = Date.now): RateLimiter {
  const windows = new Map<string, { count: number; resetAt: number }>();

  return {
    consume(key, limit, windowSec) {
      const currentTime = now();
      const existing = windows.get(key);

      if (existing === undefined || existing.resetAt <= currentTime) {
        const resetAt = currentTime + windowSec * 1000;
        windows.set(key, { count: 1, resetAt });
        return Promise.resolve({ allowed: true, remaining: limit - 1, retryAfterSec: 0, limit });
      }

      existing.count += 1;
      const allowed = existing.count <= limit;
      return Promise.resolve({
        allowed,
        remaining: Math.max(0, limit - existing.count),
        retryAfterSec: allowed ? 0 : Math.ceil((existing.resetAt - currentTime) / 1000),
        limit,
      });
    },
  };
}
