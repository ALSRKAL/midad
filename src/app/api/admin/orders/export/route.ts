/** Admin orders CSV export (P10-T04). ADMIN re-checked here. */

import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";

import { toCsv } from "@/lib/csv";
import { exportAdminOrders, parseAdminOrderFilters } from "@/server/admin/orders";
import { getCurrentSession } from "@/server/session";

export async function GET(request: Request): Promise<NextResponse> {
  const user = await getCurrentSession();
  if (user === null) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const url = new URL(request.url);
  const raw: Record<string, string> = {};
  for (const [key, value] of url.searchParams.entries()) raw[key] = value;

  const filters = parseAdminOrderFilters(raw);
  const locale = url.searchParams.get("lang") === "en" ? "en" : "ar";
  const [rows, t] = await Promise.all([
    exportAdminOrders(filters),
    getTranslations({ locale, namespace: "Admin" }),
  ]);

  const statusLabel = (status: string): string =>
    status === "PAID"
      ? t("orderStatusPaid")
      : status === "PENDING"
        ? t("orderStatusPending")
        : status === "FAILED"
          ? t("orderStatusFailed")
          : status === "CANCELLED"
            ? t("orderStatusCancelled")
            : status === "REFUNDED"
              ? t("orderStatusRefunded")
              : t("orderStatusPartiallyRefunded");

  const csv = toCsv(
    [
      t("colLearner"),
      "Email",
      t("colOrder"),
      t("colCourses"),
      `${t("colAmount")} (minor units)`,
      "Currency",
      t("colOrderStatus"),
      `${t("colCreated")} (ISO)`,
      "ID",
    ],
    rows.map((row) => [
      row.userName,
      row.userEmail,
      row.id,
      row.courses.join(" | "),
      row.totalCents,
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
      "Content-Disposition": `attachment; filename="midad-orders-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
