import { describe, expect, it } from "vitest";

import { instructorShareCents } from "@/lib/earnings-rules";

/** BR-11 instructor share arithmetic. */

describe("BR-11 instructor share", () => {
  it("computes 70% of the post-discount pre-tax amount", () => {
    expect(instructorShareCents(10_000, 7000)).toBe(7_000);
    expect(instructorShareCents(8_696, 7000)).toBe(6_087);
  });

  it("applies banker's rounding to the halala", () => {
    expect(instructorShareCents(999, 7000)).toBe(699);
    // 5 × 0.7 = 3.5 → half-even rounds to 4; 15 × 0.7 = 10.5 → 10.
    expect(instructorShareCents(5, 7000)).toBe(4);
    expect(instructorShareCents(15, 7000)).toBe(10);
  });

  it("rejects rates and amounts outside the money domain", () => {
    expect(() => instructorShareCents(-1, 7000)).toThrow();
    expect(() => instructorShareCents(1000, 10_001)).toThrow();
    expect(() => instructorShareCents(1000.5, 7000)).toThrow();
  });
});
