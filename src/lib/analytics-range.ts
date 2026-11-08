/** Analytics range parsing (P10-T01): exactly 7, 30 or 90 whole days, otherwise the 30-day default. */

export const ANALYTICS_RANGES = [7, 30, 90] as const;

export type AnalyticsRange = (typeof ANALYTICS_RANGES)[number];

export function parseAnalyticsRange(value: string | string[] | undefined): AnalyticsRange {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  return ANALYTICS_RANGES.find((range) => range === parsed) ?? 30;
}
