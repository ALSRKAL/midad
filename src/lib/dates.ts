/**
 * Dates and time, with an injectable clock (ADR-0007).
 *
 * Time-dependent business rules (the 14-day refund window, 14-day earnings availability) must be
 * testable without waiting two weeks, so services never call `new Date()` directly: they receive a
 * `Clock`. Tests inject an offset; production uses the system clock with no offset.
 *
 * Formatting always goes through Intl with the platform's numbering system (Latin digits in Arabic,
 * ADR-0008) and the Gregorian calendar (the product requirements).
 */

import { intlLocales, type Locale } from "@/config/site";

export type Clock = { now: () => Date };

export const systemClock: Clock = { now: () => new Date() };

/** A clock frozen at a fixed instant — for deterministic tests and the seeder. */
export function fixedClock(instant: Date): Clock {
  return { now: () => new Date(instant.getTime()) };
}

/**
 * A clock shifted by `offsetMs`. The E2E harness uses this to advance 15 days and watch earnings
 * move from pending to available (journey 7). The env var is rejected in production at boot.
 */
export function shiftedClock(offsetMs: number, base: Clock = systemClock): Clock {
  return { now: () => new Date(base.now().getTime() + offsetMs) };
}

export const DEFAULT_TIME_ZONE = "Asia/Riyadh";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days between two instants, floored — never fractional, never timezone-dependent. */
export function daysBetween(earlier: Date, later: Date): number {
  return Math.floor((later.getTime() - earlier.getTime()) / DAY_MS);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

export function addSeconds(date: Date, seconds: number): Date {
  return new Date(date.getTime() + seconds * 1000);
}

/** True when `date` is within `days` of `now` (inclusive of the boundary instant). */
export function isWithinDays(date: Date, now: Date, days: number): boolean {
  const elapsed = now.getTime() - date.getTime();
  return elapsed >= 0 && elapsed <= days * DAY_MS;
}

export function isFuture(date: Date, now: Date): boolean {
  return date.getTime() > now.getTime();
}

/** Calendar day key (YYYY-MM-DD) in the platform time zone, used for streaks. */
export function dayKey(date: Date, timeZone: string = DEFAULT_TIME_ZONE): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatDate(
  date: Date,
  locale: Locale,
  options: { style?: "short" | "long"; timeZone?: string } = {},
): string {
  return new Intl.DateTimeFormat(intlLocales[locale], {
    dateStyle: options.style ?? "short",
    timeZone: options.timeZone ?? DEFAULT_TIME_ZONE,
  }).format(date);
}

export function formatDateTime(date: Date, locale: Locale, timeZone = DEFAULT_TIME_ZONE): string {
  return new Intl.DateTimeFormat(intlLocales[locale], {
    dateStyle: "short",
    timeStyle: "short",
    timeZone,
  }).format(date);
}

/** "قبل 3 أيام" / "3 days ago" — Intl handles the plural and the direction of time. */
export function formatRelativeTime(
  date: Date,
  locale: Locale,
  now: Date = systemClock.now(),
): string {
  const formatter = new Intl.RelativeTimeFormat(intlLocales[locale], { numeric: "auto" });
  const diffSeconds = Math.round((date.getTime() - now.getTime()) / 1000);

  const divisions: Array<{ amount: number; unit: Intl.RelativeTimeFormatUnit }> = [
    { amount: 60, unit: "second" },
    { amount: 60, unit: "minute" },
    { amount: 24, unit: "hour" },
    { amount: 7, unit: "day" },
    { amount: 4.34524, unit: "week" },
    { amount: 12, unit: "month" },
    { amount: Number.POSITIVE_INFINITY, unit: "year" },
  ];

  let duration = diffSeconds;
  for (const division of divisions) {
    if (Math.abs(duration) < division.amount) {
      return formatter.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }
  return formatter.format(Math.round(duration), "year");
}

/** Formats a duration in seconds as "12:34" or "1:02:03" — used by lessons and the player. */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(rest)}` : `${minutes}:${pad(rest)}`;
}
