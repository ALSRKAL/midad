/** Admin reports CSV export (P10-T04). ADMIN re-checked here. */

import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";

import { toCsv } from "@/lib/csv";
import { exportAdminReports, parseAdminReportFilters } from "@/server/admin/reports";
import { getCurrentSession } from "@/server/session";

export async function GET(request: Request): Promise<NextResponse> {
  const user = await getCurrentSession();
  if (user === null) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const url = new URL(request.url);
  const raw: Record<string, string> = {};
  for (const [key, value] of url.searchParams.entries()) raw[key] = value;

  const filters = parseAdminReportFilters(raw);
  const locale = url.searchParams.get("lang") === "en" ? "en" : "ar";
  const [rows, t] = await Promise.all([
    exportAdminReports(filters),
    getTranslations({ locale, namespace: "Admin" }),
  ]);

  const statusLabel = (status: string): string =>
    status === "OPEN"
      ? t("reportStatusOpen")
      : status === "RESOLVED"
        ? t("reportStatusResolved")
        : t("reportStatusDismissed");

  const csv = toCsv(
    [
      t("reportTarget"),
      "Type",
      t("reportReason"),
      t("reportReporter"),
      "Reporter email",
      t("colStatus"),
      `${t("colCreated")} (ISO)`,
      "ID",
    ],
    rows.map((row) => [
      row.targetLabel,
      row.targetType,
      row.reason,
      row.reporterName,
      row.reporterEmail,
      statusLabel(row.status),
      row.createdAt.toISOString(),
      row.id,
    ]),
  );

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="midad-reports-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
