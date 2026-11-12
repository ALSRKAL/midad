import { describe, expect, it } from "vitest";

import { normalizeBilingual, normalizeText, normalizedIncludes } from "@/lib/search-normalize";

/**
 * Arabic search folding (the product requirements). These cases encode how learners actually type: no hamza, no
 * tashkeel, تاء مربوطة written as ه, ألف مقصورة written as ي, and Arabic-Indic digits.
 */
describe("normalizeText", () => {
  it("strips tashkeel and tatweel", () => {
    expect(normalizeText("مُحَمَّد")).toBe("محمد");
    expect(normalizeText("كتـــاب")).toBe("كتاب");
  });

  it("folds alef variants to a bare alef", () => {
    expect(normalizeText("أحمد")).toBe("احمد");
    expect(normalizeText("إبراهيم")).toBe("ابراهيم");
    expect(normalizeText("آمنة")).toBe("امنه");
  });

  it("folds taa marbuta to haa and alef maqsura to yaa", () => {
    expect(normalizeText("دورة")).toBe("دوره");
    expect(normalizeText("مستشفى")).toBe("مستشفي");
    expect(normalizeText("هدى")).toBe("هدي");
  });

  it("converts Arabic-Indic digits to Latin digits", () => {
    expect(normalizeText("الدرس ٣")).toBe("الدرس 3");
    expect(normalizeText("١٢٣")).toBe("123");
    expect(normalizeText("۴۵۶")).toBe("456");
  });

  it("lowercases Latin text and removes accents", () => {
    expect(normalizeText("Café Réact")).toBe("cafe react");
  });

  it("collapses whitespace and drops noisy punctuation", () => {
    expect(normalizeText("  برمجة،   الويب!؟  ")).toBe("برمجه الويب");
  });
});

describe("normalizeBilingual", () => {
  it("keeps both languages searchable in one string", () => {
    const value = normalizeBilingual("تطوير الويب", "Web Development");
    expect(value).toContain("تطوير");
    expect(value).toContain("web development");
  });

  it("ignores missing translations instead of writing 'null'", () => {
    expect(normalizeBilingual("دورة", null, undefined)).toBe("دوره");
  });
});

describe("normalizedIncludes", () => {
  const indexed = normalizeBilingual("تطوير الويب الحديث", "Modern web development");

  it("matches an Arabic query typed without hamza or tashkeel", () => {
    expect(normalizedIncludes(indexed, "تطوير الويب")).toBe(true);
    expect(normalizedIncludes(indexed, "تَطْوِير")).toBe(true);
  });

  it("matches across taa marbuta spelling", () => {
    expect(normalizedIncludes(normalizeText("دورة تصميم"), "دوره")).toBe(true);
  });

  it("matches an English query case-insensitively", () => {
    expect(normalizedIncludes(indexed, "WEB DEVELOPMENT")).toBe(true);
  });

  it("does not match unrelated text or an empty query", () => {
    expect(normalizedIncludes(indexed, "المحاسبة")).toBe(false);
    expect(normalizedIncludes(indexed, "   ")).toBe(false);
  });
});
