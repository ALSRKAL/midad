/** Admin courses CSV export (P05-T02). Same filters as the table; ADMIN enforced here again. */

import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";

import { toCsv } from "@/lib/csv";
import { exportAdminCourses, parseAdminCourseFilters } from "@/server/admin/courses";
import { getCurrentSession } from "@/server/session";

export async function GET(request: Request): Promise<NextResponse> {
  const user = await getCurrentSession();
  if (user === null) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const url = new URL(request.url);
  const raw: Record<string, string> = {};
  for (const [key, value] of url.searchParams.entries()) raw[key] = value;

  const filters = parseAdminCourseFilters(raw);
  const locale = url.searchParams.get("lang") === "en" ? "en" : "ar";
  const [rows, t] = await Promise.all([
    exportAdminCourses(filters),
    getTranslations({ locale, namespace: "Admin" }),
  ]);

  const statusLabel = (status: string): string =>
    status === "DRAFT"
      ? t("courseDraft")
      : status === "PENDING_REVIEW"
        ? t("coursePending")
        : status === "PUBLISHED"
          ? t("coursePublished")
          : status === "REJECTED"
            ? t("courseRejected")
            : status === "UNLISTED"
              ? t("courseUnlisted")
              : t("courseArchived");

  const csv = toCsv(
    [
      t("colCourse"),
      t("colInstructor"),
      t("colStatus"),
      t("colLessons"),
      t("colPrice"),
      `${t("colUpdated")} (ISO)`,
      "ID",
    ],
    rows.map((row) => [
      locale === "en"
        ? (row.titleEn ?? row.titleAr ?? row.slug)
        : (row.titleAr ?? row.titleEn ?? row.slug),
      row.instructorName,
      statusLabel(row.status),
      row.lessonCount,
      row.isFree ? 0 : row.priceCents,
      row.updatedAt.toISOString(),
      row.id,
    ]),
  );

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="midad-courses-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
