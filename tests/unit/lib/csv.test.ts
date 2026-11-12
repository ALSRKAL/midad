import { describe, expect, it } from "vitest";

import { toCsv } from "@/lib/csv";

/** Admin CSV export (P05-T01). Arabic must survive Excel, quotes must not break columns. */
describe("toCsv", () => {
  it("starts with a BOM and CRLF line endings", () => {
    const csv = toCsv(["a", "b"], [[1, 2]]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("a,b\r\n");
    expect(csv.endsWith("\r\n")).toBe(true);
  });

  it("keeps Arabic text intact", () => {
    expect(toCsv(["الاسم"], [["ريم الدوسري"]])).toContain("ريم الدوسري");
  });

  it("quotes cells containing commas, quotes or newlines", () => {
    const csv = toCsv(["x"], [["a,b"], ['say "hi"'], ["line1\nline2"]]);
    expect(csv).toContain('"a,b"');
    expect(csv).toContain('"say ""hi"""');
    expect(csv).toContain('"line1\nline2"');
  });

  it("renders empty cells for null and undefined", () => {
    expect(toCsv(["a", "b", "c"], [[null, undefined, ""]])).toContain("a,b,c\r\n,,\r\n");
  });
});
