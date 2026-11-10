import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AdminDataTable, type AdminColumn } from "@/components/admin/admin-data-table";
import { Badge } from "@/components/ui/badge";
import { AutoSubmitSelect } from "@/components/ui/auto-submit-select";
import { Label } from "@/components/ui/label";
import { ReportActions } from "@/features/admin/components/report-actions";
import { formatDate } from "@/lib/dates";
import {
  listAdminReports,
  parseAdminReportFilters,
  type AdminReportRow,
} from "@/server/admin/reports";

/** Reports queue (P10-T04): reviews, questions and replies. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Admin" });
  return { title: t("reportsTitle") };
}

export default async function AdminReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const filters = parseAdminReportFilters((await searchParams) as Record<string, string>);
  const [result, t] = await Promise.all([
    listAdminReports(filters),
    getTranslations({ locale, namespace: "Admin" }),
  ]);
  const localeValue = locale === "en" ? "en" : "ar";

  const query: Record<string, string> = {
    ...(filters.q === "" ? {} : { q: filters.q }),
    status: filters.status,
    sort: filters.sort,
    dir: filters.dir,
  };
  const csvParams = new URLSearchParams(query).toString();

  const statusLabel = (status: AdminReportRow["status"]) =>
    status === "OPEN"
      ? t("reportStatusOpen")
      : status === "RESOLVED"
        ? t("reportStatusResolved")
        : t("reportStatusDismissed");
  const typeLabel = (type: AdminReportRow["targetType"]) =>
    type === "REVIEW"
      ? t("reportTargetReview")
      : type === "THREAD"
        ? t("reportTargetThread")
        : t("reportTargetReply");

  const columns: AdminColumn<AdminReportRow>[] = [
    {
      key: "target",
      label: t("reportTarget"),
      render: (row) => (
        <div>
          <p className="max-w-72 text-sm text-foreground">{row.targetLabel}</p>
          <p className="mt-1 text-xs text-muted-foreground">{typeLabel(row.targetType)}</p>
        </div>
      ),
      csv: (row) => `${row.targetType}: ${row.targetLabel}`,
    },
    {
      key: "reason",
      label: t("reportReason"),
      render: (row) => (
        <div className="max-w-64">
          <p className="text-sm text-foreground">{row.reason}</p>
          {row.details !== null && (
            <p className="mt-1 text-xs text-muted-foreground">{row.details}</p>
          )}
        </div>
      ),
      csv: (row) => `${row.reason} ${row.details ?? ""}`,
    },
    {
      key: "reporter",
      label: t("reportReporter"),
      render: (row) => (
        <div>
          <p className="text-sm text-foreground">{row.reporterName}</p>
          <p className="text-xs text-muted-foreground" dir="ltr">
            {row.reporterEmail}
          </p>
        </div>
      ),
      csv: (row) => `${row.reporterName} <${row.reporterEmail}>`,
    },
    {
      key: "status",
      label: t("colStatus"),
      sortable: true,
      render: (row) => (
        <Badge
          variant={
            row.status === "RESOLVED"
              ? "success"
              : row.status === "DISMISSED"
                ? "neutral"
                : "warning"
          }
        >
          {statusLabel(row.status)}
        </Badge>
      ),
      csv: (row) => statusLabel(row.status),
    },
    {
      key: "createdAt",
      label: t("colCreated"),
      sortable: true,
      render: (row) => formatDate(row.createdAt, localeValue),
      csv: (row) => row.createdAt.toISOString(),
    },
    {
      key: "actions",
      label: t("reportActions"),
      align: "end",
      render: (row) => (row.status === "OPEN" ? <ReportActions reportId={row.id} /> : "—"),
      csv: () => "",
    },
  ];

  return (
    <div>
      <h2 className="font-heading text-xl font-semibold text-foreground">{t("reportsTitle")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("reportsSubtitle")}</p>

      <div className="mt-5">
        <AdminDataTable
          columns={columns}
          rows={result.rows}
          total={result.total}
          page={result.page}
          pageCount={result.pageCount}
          query={query}
          basePath="/admin/reports"
          formAction={`/${locale}/admin/reports`}
          searchValue={filters.q}
          searchPlaceholder={t("searchReportsPlaceholder")}
          csvHref={`/api/admin/reports/export?${csvParams}&lang=${localeValue}`}
          filterLabel={t("filterLabel")}
          filters={
            <div className="space-y-1">
              <Label htmlFor="filter-report-status">{t("colStatus")}</Label>
              <AutoSubmitSelect
                id="filter-report-status"
                name="status"
                defaultValue={filters.status}
                containerClassName="w-auto"
                className="h-9 pe-8 text-sm"
              >
                <option value="ALL">{t("allReportStatuses")}</option>
                <option value="OPEN">{t("reportStatusOpen")}</option>
                <option value="RESOLVED">{t("reportStatusResolved")}</option>
                <option value="DISMISSED">{t("reportStatusDismissed")}</option>
              </AutoSubmitSelect>
            </div>
          }
        />
      </div>
    </div>
  );
}
