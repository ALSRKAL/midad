/** Admin contact messages CSV export (P10-T04). ADMIN re-checked here. */

import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";

import { toCsv } from "@/lib/csv";
import { exportAdminContactMessages, parseAdminContactFilters } from "@/server/admin/contact";
import { getCurrentSession } from "@/server/session";

export async function GET(request: Request): Promise<NextResponse> {
  const user = await getCurrentSession();
  if (user === null) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const url = new URL(request.url);
  const raw: Record<string, string> = {};
  for (const [key, value] of url.searchParams.entries()) raw[key] = value;

  const filters = parseAdminContactFilters(raw);
  const locale = url.searchParams.get("lang") === "en" ? "en" : "ar";
  const [rows, t] = await Promise.all([
    exportAdminContactMessages(filters),
    getTranslations({ locale, namespace: "Admin" }),
  ]);

  const statusLabel = (status: string): string =>
    status === "NEW"
      ? t("contactStatusNew")
      : status === "READ"
        ? t("contactStatusRead")
        : t("contactStatusArchived");

  const csv = toCsv(
    [
      t("contactSender"),
      "Email",
      t("contactSubject"),
      "Message",
      t("colStatus"),
      `${t("colCreated")} (ISO)`,
      "ID",
    ],
    rows.map((row) => [
      row.name,
      row.email,
      row.subject,
      row.message,
      statusLabel(row.status),
      row.createdAt.toISOString(),
      row.id,
    ]),
  );

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="midad-contact-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
