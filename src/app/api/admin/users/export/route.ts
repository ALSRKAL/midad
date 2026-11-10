/**
 * Admin users CSV export (P05-T01).
 *
 * A route handler because the browser must download a file. Authorization is re-checked here: the
 * extension being linked from the admin table protects nothing by itself.
 */

import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";

import { toCsv } from "@/lib/csv";
import { exportAdminUsers, parseAdminUserFilters } from "@/server/admin/users";
import { getCurrentSession } from "@/server/session";

export async function GET(request: Request): Promise<NextResponse> {
  const user = await getCurrentSession();
  if (user === null) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const url = new URL(request.url);
  const raw: Record<string, string> = {};
  for (const [key, value] of url.searchParams.entries()) raw[key] = value;

  const filters = parseAdminUserFilters(raw);
  const locale = url.searchParams.get("lang") === "en" ? "en" : "ar";
  const [rows, t] = await Promise.all([
    exportAdminUsers(filters),
    getTranslations({ locale, namespace: "Admin" }),
  ]);

  const roleLabel = (role: string): string =>
    role === "ADMIN"
      ? t("roleAdmin")
      : role === "INSTRUCTOR"
        ? t("roleInstructor")
        : t("roleStudent");
  const statusLabel = (status: string): string =>
    status === "BANNED"
      ? t("statusBanned")
      : status === "DELETED"
        ? t("statusDeleted")
        : t("statusActive");

  const csv = toCsv(
    [
      t("colUser"),
      t("colRole"),
      t("colStatus"),
      "ID",
      "Email",
      t("colEnrollments"),
      `${t("colJoined")} (ISO)`,
    ],
    rows.map((row) => [
      row.name,
      roleLabel(row.role),
      statusLabel(row.status),
      row.id,
      row.email,
      row.enrollmentCount,
      row.createdAt.toISOString(),
    ]),
  );

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="midad-users-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
