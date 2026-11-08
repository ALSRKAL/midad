/**
 * Learning progress rules (BR-14, BR-15).
 *
 * Pure functions only: reading and writing progress belongs to `server/progress.ts`.
 *
 * Video completion is based on the union of watched intervals, not the last playback position: a
 * learner who drags the scrubber to the end has watched almost nothing. Intervals are merged so
 * rewatching a segment never double counts, and course progress is whole-percent completed lessons
 * over currently published lessons.
 */

export type WatchedSegment = readonly [startSec: number, endSec: number];

const COMPLETION_RATIO = 0.9;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Sorts, clamps and merges overlapping/adjacent intervals. */
export function normaliseSegments(
  segments: readonly WatchedSegment[],
  durationSec: number,
): WatchedSegment[] {
  if (!Number.isFinite(durationSec) || durationSec <= 0) return [];
  const cleaned = segments
    .map(([start, end]) => {
      const low = clamp(Math.min(start, end), 0, durationSec);
      const high = clamp(Math.max(start, end), 0, durationSec);
      return [low, high] as const;
    })
    .filter(([start, end]) => end > start)
    .sort((a, b) => a[0] - b[0]);

  const merged: Array<[number, number]> = [];
  for (const [start, end] of cleaned) {
    const last = merged[merged.length - 1];
    if (last !== undefined && start <= last[1] + 0.5) {
      last[1] = Math.max(last[1], end);
    } else {
      merged.push([start, end]);
    }
  }
  return merged;
}

/** Adds one playback interval and returns the normalised union. */
export function addWatchedSegment(
  existing: readonly WatchedSegment[],
  startSec: number,
  endSec: number,
  durationSec: number,
): WatchedSegment[] {
  return normaliseSegments([...existing, [startSec, endSec]], durationSec);
}

export function watchedSeconds(segments: readonly WatchedSegment[]): number {
  return segments.reduce((total, [start, end]) => total + Math.max(0, end - start), 0);
}

/** True once at least 90% of the duration has actually been watched. */
export function isWatchComplete(segments: readonly WatchedSegment[], durationSec: number): boolean {
  if (!Number.isFinite(durationSec) || durationSec <= 0) return false;
  return watchedSeconds(normaliseSegments(segments, durationSec)) >= durationSec * COMPLETION_RATIO;
}

/** Whole-percent progress; adding lessons lowers it, and it never exceeds 100. */
export function courseProgressPct(completedLessons: number, publishedLessons: number): number {
  if (!Number.isInteger(completedLessons) || completedLessons < 0) {
    throw new Error("completedLessons must be a non-negative integer");
  }
  if (!Number.isInteger(publishedLessons) || publishedLessons < 0) {
    throw new Error("publishedLessons must be a non-negative integer");
  }
  if (publishedLessons === 0) return 0;
  return Math.min(100, Math.max(0, Math.round((completedLessons / publishedLessons) * 100)));
}

/** Human duration formatting for the player sidebar and dashboard. */
export function formatDurationLabel(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  if (hours > 0)
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}
