/** Admin refunds CSV export (P10-T03). ADMIN re-checked here. */

import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";

import { toCsv } from "@/lib/csv";
import { exportAdminRefunds, parseAdminRefundFilters } from "@/server/admin/refunds";
import { getCurrentSession } from "@/server/session";

export async function GET(request: Request): Promise<NextResponse> {
  const user = await getCurrentSession();
  if (user === null) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const url = new URL(request.url);
  const raw: Record<string, string> = {};
  for (const [key, value] of url.searchParams.entries()) raw[key] = value;

  const filters = parseAdminRefundFilters(raw);
  const locale = url.searchParams.get("lang") === "en" ? "en" : "ar";
  const [rows, t] = await Promise.all([
    exportAdminRefunds(filters),
    getTranslations({ locale, namespace: "Admin" }),
  ]);

  const statusLabel = (status: string): string =>
    status === "REQUESTED"
      ? t("refundStatusRequested")
      : status === "APPROVED"
        ? t("refundStatusApproved")
        : status === "COMPLETED"
          ? t("refundStatusCompleted")
          : t("refundStatusRejected");

  const csv = toCsv(
    [
      t("colLearner"),
      "Email",
      t("colOrder"),
      t("colCourses"),
      `${t("colAmount")} (minor units)`,
      "Currency",
      t("colRefundStatus"),
      `${t("colRequested")} (ISO)`,
      "ID",
    ],
    rows.map((row) => [
      row.learnerName,
      row.learnerEmail,
      row.orderId,
      row.courses.join(" | "),
      row.amountCents,
      row.currency,
      statusLabel(row.status),
      row.createdAt.toISOString(),
      row.id,
    ]),
  );

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="midad-refunds-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
