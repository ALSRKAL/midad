import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/** P12-T01: every BR-01…BR-21 rule has at least one named test in the repository. */

function testFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return testFiles(path);
    return /\.(test|spec)\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

describe("business rule inventory", () => {
  const files = [
    ...testFiles(join(process.cwd(), "tests")),
    ...testFiles(join(process.cwd(), "tests", "e2e")),
  ];
  const corpus = files.map((file) => readFileSync(file, "utf8")).join("\n");

  it("has a named test for all 21 business rules", () => {
    const missing = Array.from(
      { length: 21 },
      (_, index) => `BR-${String(index + 1).padStart(2, "0")}`,
    ).filter((rule) => !corpus.includes(rule));
    expect(missing, `rules without a named test: ${missing.join(", ")}`).toEqual([]);
  });

  it("keeps the pricing table at 30+ cases", () => {
    const pricing = readFileSync(join(process.cwd(), "tests/unit/cart/pricing.test.ts"), "utf8");
    expect(pricing).toContain("length: 30");
    expect(pricing).toContain("it.each");
  });
});
