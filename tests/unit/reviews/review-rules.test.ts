import { describe, expect, it } from "vitest";

import { averageRating, isValidRating, reviewEligibility } from "@/lib/review-rules";

/** BR-18 review eligibility and denormalised rating arithmetic. */

describe("BR-18 reviews", () => {
  it("BR-18: rejects review at 19% progress", () => {
    expect(reviewEligibility({ enrolled: true, progressPct: 19, minProgressPct: 20 })).toEqual({
      allowed: false,
      reason: "PROGRESS_TOO_LOW",
    });
  });

  it("BR-18: allows review at 20%", () => {
    expect(reviewEligibility({ enrolled: true, progressPct: 20, minProgressPct: 20 })).toEqual({
      allowed: true,
    });
  });

  it("BR-18: rejects a non-enrolled user", () => {
    expect(reviewEligibility({ enrolled: false, progressPct: 100, minProgressPct: 20 })).toEqual({
      allowed: false,
      reason: "ENROLLMENT_REQUIRED",
    });
  });

  it("BR-18: rating must be an integer from 1 to 5", () => {
    expect(isValidRating(1)).toBe(true);
    expect(isValidRating(5)).toBe(true);
    expect(isValidRating(0)).toBe(false);
    expect(isValidRating(6)).toBe(false);
    expect(isValidRating(4.5)).toBe(false);
  });

  it("BR-18: average is stored with two decimals as ×100", () => {
    expect(averageRating([5, 4, 4])).toEqual({ averageX100: 433, count: 3 });
    expect(averageRating([5])).toEqual({ averageX100: 500, count: 1 });
    expect(averageRating([])).toEqual({ averageX100: 0, count: 0 });
  });
});
