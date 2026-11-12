import { describe, expect, it } from "vitest";

import { ANALYTICS_RANGES, parseAnalyticsRange } from "@/lib/analytics-range";

describe("P10-T01 analytics range", () => {
  it("accepts exactly the three supported ranges", () => {
    expect(ANALYTICS_RANGES).toEqual([7, 30, 90]);
    expect(parseAnalyticsRange("7")).toBe(7);
    expect(parseAnalyticsRange("30")).toBe(30);
    expect(parseAnalyticsRange("90")).toBe(90);
    expect(parseAnalyticsRange(["90", "7"])).toBe(90);
  });

  it("falls back to 30 days for missing or unsupported values", () => {
    expect(parseAnalyticsRange(undefined)).toBe(30);
    expect(parseAnalyticsRange("")).toBe(30);
    expect(parseAnalyticsRange("365")).toBe(30);
    expect(parseAnalyticsRange("-7")).toBe(30);
  });
});
