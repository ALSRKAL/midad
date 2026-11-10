/** Admin applications CSV export (P05-T03). ADMIN re-checked here. */

import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";

import { toCsv } from "@/lib/csv";
import { exportAdminApplications, parseAdminApplicationFilters } from "@/server/admin/applications";
import { getCurrentSession } from "@/server/session";

export async function GET(request: Request): Promise<NextResponse> {
  const user = await getCurrentSession();
  if (user === null) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const url = new URL(request.url);
  const raw: Record<string, string> = {};
  for (const [key, value] of url.searchParams.entries()) raw[key] = value;

  const filters = parseAdminApplicationFilters(raw);
  const locale = url.searchParams.get("lang") === "en" ? "en" : "ar";
  const [rows, t] = await Promise.all([
    exportAdminApplications(filters),
    getTranslations({ locale, namespace: "Admin" }),
  ]);

  const statusLabel = (status: string): string =>
    status === "APPROVED"
      ? t("applicationApproved")
      : status === "REJECTED"
        ? t("applicationRejected")
        : t("applicationPending");

  const csv = toCsv(
    [
      t("colApplicant"),
      "Email",
      t("colField"),
      t("colExperience"),
      t("colStatus"),
      `${t("colSubmitted")} (ISO)`,
      "ID",
    ],
    rows.map((row) => [
      row.applicantName,
      row.applicantEmail,
      row.field,
      row.experience,
      statusLabel(row.status),
      row.createdAt.toISOString(),
      row.id,
    ]),
  );

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="midad-applications-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
