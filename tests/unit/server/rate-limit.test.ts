import { describe, expect, it } from "vitest";

import { createMemoryRateLimiter } from "@/server/rate-limit";

/**
 * The in-memory limiter exists for tests and for single-process tools; its semantics mirror the
 * Redis implementation (fixed window, first request opens the window, blocked requests report the
 * remaining time), so these tests pin the behaviour both share.
 */
describe("rate limiter", () => {
  it("allows requests up to the limit and reports the remaining budget", async () => {
    const limiter = createMemoryRateLimiter(() => 1_000);

    const first = await limiter.consume("login:1.2.3.4", 5, 60);
    expect(first).toMatchObject({ allowed: true, remaining: 4, limit: 5, retryAfterSec: 0 });

    const second = await limiter.consume("login:1.2.3.4", 5, 60);
    expect(second).toMatchObject({ allowed: true, remaining: 3 });
  });

  it("blocks the request after the limit is exhausted", async () => {
    const limiter = createMemoryRateLimiter(() => 1_000);
    for (let index = 0; index < 5; index += 1) {
      await limiter.consume("login:ip", 5, 60);
    }

    const blocked = await limiter.consume("login:ip", 5, 60);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSec).toBe(60);
  });

  it("keeps separate counters per key", async () => {
    const limiter = createMemoryRateLimiter(() => 1_000);
    await limiter.consume("login:a", 1, 60);

    expect((await limiter.consume("login:b", 1, 60)).allowed).toBe(true);
    expect((await limiter.consume("login:a", 1, 60)).allowed).toBe(false);
  });

  it("resets once the window has elapsed", async () => {
    let now = 1_000;
    const limiter = createMemoryRateLimiter(() => now);

    await limiter.consume("coupon:user", 1, 60);
    expect((await limiter.consume("coupon:user", 1, 60)).allowed).toBe(false);

    now += 60_000;
    expect((await limiter.consume("coupon:user", 1, 60)).allowed).toBe(true);
  });

  it("reports the decreasing time left in the window", async () => {
    let now = 0;
    const limiter = createMemoryRateLimiter(() => now);

    await limiter.consume("quiz:user", 1, 60);
    now = 20_000;
    const blocked = await limiter.consume("quiz:user", 1, 60);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBe(40);
  });

  it("allows exactly the limit when it is 1 (login brute force guard)", async () => {
    const limiter = createMemoryRateLimiter(() => 0);
    expect((await limiter.consume("login", 1, 60)).allowed).toBe(true);
    expect((await limiter.consume("login", 1, 60)).allowed).toBe(false);
  });
});
