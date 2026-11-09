"use client";

import { useTranslations } from "next-intl";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { AnalyticsPoint } from "@/server/instructor-analytics";
import { formatMoney } from "@/lib/money";

/**
 * Instructor range charts (P10-T01). Recharts is client-only; the server has already computed every
 * number from the ledger and enrolments. A visually hidden table mirrors both series for screen
 * readers, because the SVG itself carries no data semantics.
 */

const ARABIC = "ar-SA-u-nu-latn";

export function AnalyticsCharts({
  points,
  locale,
}: {
  points: AnalyticsPoint[];
  locale: "ar" | "en";
}) {
  const t = useTranslations("InstructorAnalytics");
  const dayFormatter = new Intl.DateTimeFormat(locale === "ar" ? ARABIC : "en-US", {
    month: "short",
    day: "numeric",
  });
  const formatDay = (value: string) => dayFormatter.format(new Date(`${value}T00:00:00Z`));
  const formatLabel = (value: unknown) =>
    typeof value === "string" || typeof value === "number" ? formatDay(String(value)) : "";
  const formatRevenue = (value: number) => formatMoney({ amount: value, currency: "SAR" }, locale);
  const axisColor = "var(--muted-foreground)";
  const gridColor = "var(--border)";
  const tooltipStyle = {
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "0.375rem",
    color: "var(--surface-foreground)",
  } as const;

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      <figure className="min-w-0 rounded-md border border-border bg-surface p-5">
        <figcaption>
          <h3 className="font-heading text-lg font-semibold text-foreground">
            {t("revenueChart")}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{t("revenueChartHint")}</p>
        </figcaption>
        <div className="mt-4 h-64" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={points}
              margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
              accessibilityLayer={false}
            >
              <defs>
                <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDay}
                reversed={locale === "ar"}
                tick={{ fill: axisColor, fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: gridColor }}
                minTickGap={24}
              />
              <YAxis
                orientation={locale === "ar" ? "right" : "left"}
                tickFormatter={(value: number) => String(Math.round(value / 100))}
                tick={{ fill: axisColor, fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={44}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => [formatRevenue(Number(value)), t("revenue")]}
                labelFormatter={(label) => formatLabel(label)}
              />
              <Area
                type="monotone"
                dataKey="revenueCents"
                stroke="var(--primary)"
                strokeWidth={2}
                fill="url(#revenue-fill)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </figure>

      <figure className="min-w-0 rounded-md border border-border bg-surface p-5">
        <figcaption>
          <h3 className="font-heading text-lg font-semibold text-foreground">
            {t("studentsChart")}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{t("studentsChartHint")}</p>
        </figcaption>
        <div className="mt-4 h-64" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={points}
              margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
              accessibilityLayer={false}
            >
              <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDay}
                reversed={locale === "ar"}
                tick={{ fill: axisColor, fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: gridColor }}
                minTickGap={24}
              />
              <YAxis
                orientation={locale === "ar" ? "right" : "left"}
                allowDecimals={false}
                tick={{ fill: axisColor, fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={36}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => [String(value), t("newStudents")]}
                labelFormatter={(label) => formatLabel(label)}
              />
              <Bar
                dataKey="newStudents"
                fill="var(--accent-strong)"
                radius={[3, 3, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </figure>

      <table className="sr-only">
        <caption>{t("tableCaption")}</caption>
        <thead>
          <tr>
            <th scope="col">{t("date")}</th>
            <th scope="col">{t("revenue")}</th>
            <th scope="col">{t("newStudents")}</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.date}>
              <th scope="row">{formatDay(point.date)}</th>
              <td>{formatRevenue(point.revenueCents)}</td>
              <td>{point.newStudents}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
