import { describe, expect, it } from "vitest";

import {
  addDays,
  addSeconds,
  dayKey,
  daysBetween,
  fixedClock,
  formatDate,
  formatDateTime,
  formatDuration,
  formatRelativeTime,
  isFuture,
  isWithinDays,
  shiftedClock,
} from "@/lib/dates";

const instant = new Date("2026-03-01T10:00:00.000Z");

describe("injectable clock (ADR-0007)", () => {
  it("a fixed clock returns the same instant every time", () => {
    const clock = fixedClock(instant);
    expect(clock.now().toISOString()).toBe(instant.toISOString());
    expect(clock.now().toISOString()).toBe(clock.now().toISOString());
  });

  it("returns a copy, so callers cannot mutate the fixed instant", () => {
    const clock = fixedClock(instant);
    const first = clock.now();
    first.setUTCFullYear(1999);
    expect(clock.now().getUTCFullYear()).toBe(2026);
  });

  it("shifts time forward for refund-window and payout tests", () => {
    const clock = shiftedClock(15 * 24 * 60 * 60 * 1000, fixedClock(instant));
    expect(daysBetween(instant, clock.now())).toBe(15);
  });
});

describe("day arithmetic", () => {
  it("counts whole days between two instants", () => {
    expect(daysBetween(instant, addDays(instant, 14))).toBe(14);
    expect(daysBetween(instant, addDays(instant, 1))).toBe(1);
    expect(daysBetween(addDays(instant, 1), instant)).toBe(-1);
  });

  it("floors partial days", () => {
    expect(daysBetween(instant, new Date(instant.getTime() + 23 * 60 * 60 * 1000))).toBe(0);
  });

  it("adds days and seconds without mutating the input", () => {
    const later = addDays(instant, 3);
    expect(later.toISOString()).toBe("2026-03-04T10:00:00.000Z");
    expect(instant.toISOString()).toBe("2026-03-01T10:00:00.000Z");
    expect(addSeconds(instant, 90).toISOString()).toBe("2026-03-01T10:01:30.000Z");
  });
});

describe("BR-10 refund window", () => {
  const purchased = new Date("2026-01-01T09:00:00.000Z");

  it("accepts day 14", () => {
    expect(isWithinDays(purchased, addDays(purchased, 14), 14)).toBe(true);
  });

  it("rejects day 15", () => {
    expect(isWithinDays(purchased, addDays(purchased, 15), 14)).toBe(false);
  });

  it("rejects a future purchase date", () => {
    expect(isWithinDays(purchased, addDays(purchased, -1), 14)).toBe(false);
  });

  it("recognises a future instant", () => {
    expect(isFuture(addDays(purchased, 1), purchased)).toBe(true);
    expect(isFuture(purchased, purchased)).toBe(false);
  });
});

describe("day keys for streaks", () => {
  it("uses the platform timezone, so a late-night session counts for its local day", () => {
    // 22:30 UTC is 01:30 the next day in Riyadh (UTC+3).
    expect(dayKey(new Date("2026-03-01T22:30:00.000Z"))).toBe("2026-03-02");
  });

  it("is stable across the same local day", () => {
    expect(dayKey(new Date("2026-03-01T05:00:00.000Z"))).toBe(
      dayKey(new Date("2026-03-01T18:00:00.000Z")),
    );
  });
});

describe("Intl formatting", () => {
  it("formats dates in both locales with Latin digits", () => {
    const arabic = formatDate(instant, "ar");
    const english = formatDate(instant, "en");
    expect(arabic).toMatch(/[0-9]/);
    expect(english).toMatch(/\d{1,2}\/\d{1,2}\/\d{2}/);
    // Arabic must use 0–9, never Arabic-Indic digits (ADR-0008).
    expect(arabic).not.toMatch(/[٠-٩]/);
  });

  it("formats a long date", () => {
    expect(formatDate(instant, "en", { style: "long" })).toMatch(/March/);
  });

  it("formats date and time together", () => {
    const formatted = formatDateTime(instant, "en");
    expect(formatted).toMatch(/\d{1,2}\/\d{1,2}\/\d{2}/);
    expect(formatted).toMatch(/\d{1,2}:\d{2}/);
  });

  it("formats relative time in the past", () => {
    const threeDaysAgo = addDays(instant, -3);
    expect(formatRelativeTime(threeDaysAgo, "en", instant)).toMatch(/3 days ago/);
    expect(formatRelativeTime(threeDaysAgo, "ar", instant)).toMatch(/قبل/);
  });

  it("formats relative time in the future", () => {
    const inTwoHours = addSeconds(instant, 2 * 60 * 60);
    expect(formatRelativeTime(inTwoHours, "en", instant)).toMatch(/2 hours/);
  });
});

describe("lesson durations", () => {
  it("formats minutes and seconds", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(59)).toBe("0:59");
    expect(formatDuration(754)).toBe("12:34");
  });

  it("formats hours when needed", () => {
    expect(formatDuration(3723)).toBe("1:02:03");
  });

  it("never returns a negative duration", () => {
    expect(formatDuration(-10)).toBe("0:00");
  });
});
