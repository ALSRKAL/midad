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

import { formatMoney } from "@/lib/money";
import type { AdminAnalyticsPoint } from "@/server/admin/analytics";

/** Platform KPI charts (P10-T04). Same accessibility approach as the instructor charts. */
export function AdminAnalyticsCharts({
  points,
  locale,
}: {
  points: AdminAnalyticsPoint[];
  locale: "ar" | "en";
}) {
  const t = useTranslations("Admin");
  const dayFormatter = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-nu-latn" : "en-US", {
    month: "short",
    day: "numeric",
  });
  const formatDay = (value: string) => dayFormatter.format(new Date(`${value}T00:00:00Z`));
  const formatLabel = (value: unknown) =>
    typeof value === "string" || typeof value === "number" ? formatDay(String(value)) : "";
  const money = (value: number) => formatMoney({ amount: value, currency: "SAR" }, locale);
  const axisColor = "var(--muted-foreground)";
  const gridColor = "var(--border)";
  const tooltipStyle = {
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "0.375rem",
    color: "var(--surface-foreground)",
  } as const;

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <figure className="min-w-0 rounded-md border border-border bg-surface p-5">
        <figcaption>
          <h3 className="font-heading text-lg font-semibold text-foreground">
            {t("adminRevenueChart")}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{t("adminRevenueChartHint")}</p>
        </figcaption>
        <div className="mt-4 h-64" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} accessibilityLayer={false}>
              <defs>
                <linearGradient id="admin-revenue-fill" x1="0" y1="0" x2="0" y2="1">
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
                width={48}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => [money(Number(value)), t("kpiRevenue")]}
                labelFormatter={(label) => formatLabel(label)}
              />
              <Area
                type="monotone"
                dataKey="revenueCents"
                stroke="var(--primary)"
                strokeWidth={2}
                fill="url(#admin-revenue-fill)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </figure>

      <figure className="min-w-0 rounded-md border border-border bg-surface p-5">
        <figcaption>
          <h3 className="font-heading text-lg font-semibold text-foreground">
            {t("adminUsersChart")}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{t("adminUsersChartHint")}</p>
        </figcaption>
        <div className="mt-4 h-64" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={points} accessibilityLayer={false}>
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
                formatter={(value) => [String(value), t("adminNewUsers")]}
                labelFormatter={(label) => formatLabel(label)}
              />
              <Bar
                dataKey="newUsers"
                fill="var(--accent-strong)"
                radius={[3, 3, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </figure>

      <table className="sr-only">
        <caption>{t("adminChartTable")}</caption>
        <thead>
          <tr>
            <th scope="col">{t("colCreated")}</th>
            <th scope="col">{t("kpiRevenue")}</th>
            <th scope="col">{t("adminNewUsers")}</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.date}>
              <th scope="row">{formatDay(point.date)}</th>
              <td>{money(point.revenueCents)}</td>
              <td>{point.newUsers}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
