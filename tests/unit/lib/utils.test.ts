import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

describe("cn", () => {
  it("joins plain class names", () => {
    expect(cn("text-sm", "font-medium")).toBe("text-sm font-medium");
  });

  it("keeps the last conflicting Tailwind utility", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-start", "text-end")).toBe("text-end");
  });

  it("ignores falsy values so conditional classes can be inlined", () => {
    expect(cn("rounded-md", false, undefined, null, "", "shadow-sm")).toBe("rounded-md shadow-sm");
  });

  it("flattens arrays and resolves conflicts across them", () => {
    expect(cn(["bg-surface", "px-2"], ["px-4"])).toBe("bg-surface px-4");
  });

  it("keeps logical spacing utilities distinct from each other", () => {
    // ms-* and me-* must never be merged: they are different sides in RTL.
    expect(cn("ms-2", "me-4")).toBe("ms-2 me-4");
  });
});
