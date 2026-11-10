import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AdminDataTable, type AdminColumn } from "@/components/admin/admin-data-table";
import { Badge } from "@/components/ui/badge";
import { AutoSubmitSelect } from "@/components/ui/auto-submit-select";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { Link } from "@/i18n/navigation";
import {
  listAdminCourses,
  parseAdminCourseFilters,
  type AdminCourseRow,
} from "@/server/admin/courses";

/** Course review queue (P05-T02). Defaults to PENDING_REVIEW, oldest submission first. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Admin" });
  return { title: t("coursesTitle") };
}

export default async function AdminCoursesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const filters = parseAdminCourseFilters(await searchParams);
  const [result, t] = await Promise.all([
    listAdminCourses(filters),
    getTranslations({ locale, namespace: "Admin" }),
  ]);
  const localeValue = locale === "en" ? "en" : "ar";

  const query: Record<string, string> = {
    ...(filters.q === "" ? {} : { q: filters.q }),
    ...(filters.status === "ALL" ? { status: "ALL" } : { status: filters.status }),
    sort: filters.sort,
    dir: filters.dir,
  };
  const csvParams = new URLSearchParams(query).toString();

  const statusLabel = (status: AdminCourseRow["status"]): string =>
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

  const columns: AdminColumn<AdminCourseRow>[] = [
    {
      key: "course",
      label: t("colCourse"),
      sortable: false,
      render: (row) => {
        const title =
          localeValue === "en"
            ? (row.titleEn ?? row.titleAr ?? row.slug)
            : (row.titleAr ?? row.titleEn ?? row.slug);
        return (
          <div className="min-w-48">
            <p className="font-medium text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground" dir="ltr">
              {row.instructorName}
            </p>
            {row.rejectionReason !== null && (
              <p className="mt-1 text-xs text-danger">{row.rejectionReason}</p>
            )}
          </div>
        );
      },
      csv: (row) =>
        localeValue === "en"
          ? (row.titleEn ?? row.titleAr ?? "")
          : (row.titleAr ?? row.titleEn ?? ""),
    },
    {
      key: "status",
      label: t("colStatus"),
      sortable: true,
      render: (row) => (
        <Badge
          variant={
            row.status === "PUBLISHED"
              ? "success"
              : row.status === "PENDING_REVIEW"
                ? "warning"
                : row.status === "REJECTED"
                  ? "danger"
                  : "neutral"
          }
        >
          {statusLabel(row.status)}
        </Badge>
      ),
      csv: (row) => statusLabel(row.status),
    },
    {
      key: "lessons",
      label: t("colLessons"),
      align: "end",
      render: (row) => <span className="tabular">{row.lessonCount}</span>,
      csv: (row) => row.lessonCount,
    },
    {
      key: "priceCents",
      label: t("colPrice"),
      sortable: true,
      align: "end",
      render: (row) =>
        row.isFree
          ? t("courseFree")
          : formatMoney({ amount: row.priceCents, currency: "SAR" }, localeValue),
      csv: (row) => row.priceCents,
    },
    {
      key: "updatedAt",
      label: t("colUpdated"),
      sortable: true,
      render: (row) => formatDate(row.updatedAt, localeValue),
      csv: (row) => row.updatedAt.toISOString(),
    },
    {
      key: "review",
      label: t("review"),
      align: "end",
      render: (row) => (
        <Link
          href={`/admin/courses/${row.id}`}
          className="font-medium text-primary hover:underline"
        >
          {t("review")}
        </Link>
      ),
      csv: (row) => row.id,
    },
  ];

  return (
    <div>
      <h2 className="font-heading text-xl font-semibold text-foreground">{t("coursesTitle")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("coursesSubtitle")}</p>

      <div className="mt-5">
        <AdminDataTable
          columns={columns}
          rows={result.rows}
          total={result.total}
          page={result.page}
          pageCount={result.pageCount}
          query={query}
          basePath="/admin/courses"
          formAction={`/${locale}/admin/courses`}
          searchValue={filters.q}
          searchPlaceholder={t("searchCoursesPlaceholder")}
          csvHref={`/api/admin/courses/export?${csvParams}&lang=${localeValue}`}
          filterLabel={t("filterLabel")}
          filters={
            <div className="space-y-1">
              <Label htmlFor="filter-course-status">{t("status")}</Label>
              <AutoSubmitSelect
                id="filter-course-status"
                name="status"
                defaultValue={filters.status}
                containerClassName="w-auto"
                className="h-9 pe-8 text-sm"
              >
                <option value="ALL">{t("allCourseStatuses")}</option>
                <option value="PENDING_REVIEW">{t("coursePending")}</option>
                <option value="DRAFT">{t("courseDraft")}</option>
                <option value="PUBLISHED">{t("coursePublished")}</option>
                <option value="REJECTED">{t("courseRejected")}</option>
                <option value="UNLISTED">{t("courseUnlisted")}</option>
                <option value="ARCHIVED">{t("courseArchived")}</option>
              </AutoSubmitSelect>
            </div>
          }
        />
      </div>
    </div>
  );
}
