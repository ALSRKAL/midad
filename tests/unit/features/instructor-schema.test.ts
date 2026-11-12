import { describe, expect, it } from "vitest";

import { instructorApplicationSchema } from "@/features/instructor/schema";

/**
 * Application validation (P02-T06).
 *
 * The link rule matters beyond tidiness: these values are rendered as anchors to admins, so only
 * absolute http(s) URLs may pass — never `javascript:` or a bare host.
 */

const valid = {
  experience: "عشر سنوات في تدريب فرق الدعم الفني وبناء أنظمة إدارة المعرفة في ثلاث شركات.",
  field: "خدمة العملاء",
  portfolioUrl: "https://example.com/portfolio",
  sampleVideoUrl: "https://example.com/sample.mp4",
};

describe("instructorApplicationSchema", () => {
  it("accepts a complete application", () => {
    const result = instructorApplicationSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("trims whitespace around text fields", () => {
    const result = instructorApplicationSchema.parse({
      ...valid,
      field: "  خدمة العملاء  ",
    });
    expect(result.field).toBe("خدمة العملاء");
  });

  it("rejects a short experience", () => {
    const result = instructorApplicationSchema.safeParse({ ...valid, experience: "قصيرة" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty field", () => {
    const result = instructorApplicationSchema.safeParse({ ...valid, field: " " });
    expect(result.success).toBe(false);
  });

  it("allows empty optional links", () => {
    const result = instructorApplicationSchema.safeParse({
      ...valid,
      portfolioUrl: "",
      sampleVideoUrl: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-http links and bare domains", () => {
    for (const portfolioUrl of [
      "javascript:alert(1)",
      "ftp://example.com/file",
      "example.com/portfolio",
    ]) {
      const result = instructorApplicationSchema.safeParse({ ...valid, portfolioUrl });
      expect(result.success, portfolioUrl).toBe(false);
    }
  });

  it("rejects a link longer than 500 characters", () => {
    const result = instructorApplicationSchema.safeParse({
      ...valid,
      sampleVideoUrl: `https://example.com/${"a".repeat(500)}`,
    });
    expect(result.success).toBe(false);
  });
});
