import { describe, expect, it } from "vitest";

import {
  addWatchedSegment,
  courseProgressPct,
  isWatchComplete,
  normaliseSegments,
  watchedSeconds,
} from "@/lib/progress";

/** BR-14 (lesson completion) and BR-15 (course progress), pure and time-independent. */

describe("BR-14 watched-segment completion", () => {
  it("BR-14: seeking to the end does not complete the lesson", () => {
    const segments = addWatchedSegment([], 98, 100, 100);
    expect(isWatchComplete(segments, 100)).toBe(false);
    expect(watchedSeconds(segments)).toBe(2);
  });

  it("BR-14: contiguous playback past 90% completes the lesson", () => {
    expect(isWatchComplete([[0, 90]], 100)).toBe(true);
  });

  it("BR-14: exactly 90% completes the lesson", () => {
    expect(isWatchComplete([[10, 100]], 100)).toBe(true);
  });

  it("BR-14: 89.9% does not complete the lesson", () => {
    expect(isWatchComplete([[0, 89.9]], 100)).toBe(false);
  });

  it("BR-14: re-watching a segment does not double count", () => {
    const once = addWatchedSegment([], 0, 50, 100);
    const twice = addWatchedSegment(once, 0, 50, 100);
    expect(watchedSeconds(twice)).toBe(50);
    expect(isWatchComplete(twice, 100)).toBe(false);
  });

  it("BR-14: separate intervals covering 90% complete the lesson", () => {
    const segments = normaliseSegments(
      [
        [0, 30],
        [40, 70],
        [80, 100],
      ],
      100,
    );
    expect(watchedSeconds(segments)).toBe(80);
    expect(isWatchComplete(segments, 100)).toBe(false);

    const more = addWatchedSegment(segments, 30, 40, 100);
    expect(watchedSeconds(more)).toBe(90);
    expect(isWatchComplete(more, 100)).toBe(true);
  });

  it("BR-14: intervals are clamped to the duration", () => {
    expect(
      normaliseSegments(
        [
          [-10, 20],
          [80, 130],
        ],
        100,
      ),
    ).toEqual([
      [0, 20],
      [80, 100],
    ]);
  });

  it("BR-14: an empty or zero-duration video is never complete", () => {
    expect(isWatchComplete([], 0)).toBe(false);
    expect(isWatchComplete([[0, 10]], 0)).toBe(false);
  });
});

describe("BR-15 course progress", () => {
  it("BR-15: rounds to whole percent", () => {
    expect(courseProgressPct(1, 3)).toBe(33);
    expect(courseProgressPct(2, 3)).toBe(67);
  });

  it("BR-15: recomputes when a lesson is added", () => {
    const before = courseProgressPct(9, 10);
    const after = courseProgressPct(9, 11);
    expect(before).toBe(90);
    expect(after).toBe(82);
    expect(after).toBeLessThan(before);
  });

  it("BR-15: unpublished lessons are excluded from the denominator", () => {
    // The caller passes only currently published lessons, so 9/10 stays 90 rather than 9/12.
    expect(courseProgressPct(9, 10)).toBe(90);
  });

  it("BR-15: no lessons means zero, not a division error", () => {
    expect(courseProgressPct(0, 0)).toBe(0);
  });

  it("BR-15: never exceeds 100", () => {
    expect(courseProgressPct(20, 10)).toBe(100);
  });

  it("BR-15: rejects impossible inputs", () => {
    expect(() => courseProgressPct(-1, 10)).toThrow();
    expect(() => courseProgressPct(1, -10)).toThrow();
    expect(() => courseProgressPct(1.5, 10)).toThrow();
  });
});
