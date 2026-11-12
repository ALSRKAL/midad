import { describe, expect, it } from "vitest";

import { SLUG_PATTERN, slugify } from "@/lib/slug";

/** Category slugs (P05-T04). */
describe("slugify", () => {
  it("lowercases and joins words with single hyphens", () => {
    expect(slugify("Data & Artificial Intelligence")).toBe("data-artificial-intelligence");
    expect(slugify("  Design   & UX  ")).toBe("design-ux");
  });

  it("strips diacritics and punctuation", () => {
    expect(slugify("Café, Crème!")).toBe("cafe-creme");
  });

  it("returns an empty string for non-Latin text", () => {
    expect(slugify("التصميم")).toBe("");
  });

  it("caps the length", () => {
    expect(slugify("a".repeat(100)).length).toBe(60);
  });
});

describe("SLUG_PATTERN", () => {
  it("accepts lowercase alphanumeric segments", () => {
    expect(SLUG_PATTERN.test("data-ai")).toBe(true);
    expect(SLUG_PATTERN.test("programming")).toBe(true);
  });

  it("rejects uppercase, spaces, leading dashes and Arabic", () => {
    expect(SLUG_PATTERN.test("Data-AI")).toBe(false);
    expect(SLUG_PATTERN.test("data ai")).toBe(false);
    expect(SLUG_PATTERN.test("-data")).toBe(false);
    expect(SLUG_PATTERN.test("تصميم")).toBe(false);
  });
});
