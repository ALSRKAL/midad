/** Admin payouts CSV export (P10-T04). ADMIN re-checked here. */

import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";

import { toCsv } from "@/lib/csv";
import { exportAdminPayouts, parseAdminPayoutFilters } from "@/server/admin/payouts";
import { getCurrentSession } from "@/server/session";

export async function GET(request: Request): Promise<NextResponse> {
  const user = await getCurrentSession();
  if (user === null) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const url = new URL(request.url);
  const raw: Record<string, string> = {};
  for (const [key, value] of url.searchParams.entries()) raw[key] = value;

  const filters = parseAdminPayoutFilters(raw);
  const locale = url.searchParams.get("lang") === "en" ? "en" : "ar";
  const [rows, t] = await Promise.all([
    exportAdminPayouts(filters),
    getTranslations({ locale, namespace: "Admin" }),
  ]);

  const statusLabel = (status: string): string =>
    status === "REQUESTED"
      ? t("payoutStatusRequested")
      : status === "APPROVED"
        ? t("payoutStatusApproved")
        : status === "PAID"
          ? t("payoutStatusPaid")
          : t("payoutStatusRejected");

  const csv = toCsv(
    [
      t("colInstructor"),
      "Email",
      `${t("colAmount")} (minor units)`,
      "Currency",
      t("colPayoutStatus"),
      t("colReference"),
      `${t("colRequested")} (ISO)`,
      "ID",
    ],
    rows.map((row) => [
      row.instructorName,
      row.instructorEmail,
      row.amountCents,
      row.currency,
      statusLabel(row.status),
      row.transferReference ?? "",
      row.createdAt.toISOString(),
      row.id,
    ]),
  );

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="midad-payouts-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
