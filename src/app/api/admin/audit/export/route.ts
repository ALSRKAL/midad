/** Admin audit-log CSV export (P05-T04). ADMIN re-checked here. */

import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";

import { toCsv } from "@/lib/csv";
import { exportAdminAudit, parseAdminAuditFilters } from "@/server/admin/audit";
import { getCurrentSession } from "@/server/session";

export async function GET(request: Request): Promise<NextResponse> {
  const user = await getCurrentSession();
  if (user === null) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const url = new URL(request.url);
  const raw: Record<string, string> = {};
  for (const [key, value] of url.searchParams.entries()) raw[key] = value;

  const filters = parseAdminAuditFilters(raw);
  const locale = url.searchParams.get("lang") === "en" ? "en" : "ar";
  const [rows, t] = await Promise.all([
    exportAdminAudit(filters),
    getTranslations({ locale, namespace: "Admin" }),
  ]);

  const csv = toCsv(
    [
      `${t("colWhen")} (ISO)`,
      t("colActor"),
      t("colAction"),
      t("colEntity"),
      "Entity ID",
      t("colIp"),
    ],
    rows.map((row) => [
      row.createdAt.toISOString(),
      row.actorEmail ?? "system",
      row.action,
      row.entity,
      row.entityId ?? "",
      row.ip ?? "",
    ]),
  );

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="midad-audit-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
