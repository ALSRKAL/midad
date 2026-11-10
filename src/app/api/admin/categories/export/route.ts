/** Admin categories CSV export (P05-T04). ADMIN re-checked here. */

import { NextResponse } from "next/server";

import { toCsv } from "@/lib/csv";
import { listAdminCategories } from "@/server/admin/categories";
import { getCurrentSession } from "@/server/session";

export async function GET(request: Request): Promise<NextResponse> {
  const user = await getCurrentSession();
  if (user === null) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  const rows = await listAdminCategories(q);

  const csv = toCsv(
    ["Name (AR)", "Name (EN)", "Slug", "Icon", "Order", "Active", "Courses", "ID"],
    rows.map((row) => [
      row.nameAr,
      row.nameEn,
      row.slug,
      row.icon ?? "",
      row.sortOrder,
      row.isActive ? "1" : "0",
      row.courseCount,
      row.id,
    ]),
  );

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="midad-categories-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
