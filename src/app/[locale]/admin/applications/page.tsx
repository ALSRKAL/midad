import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AdminDataTable, type AdminColumn } from "@/components/admin/admin-data-table";
import { Badge } from "@/components/ui/badge";
import { AutoSubmitSelect } from "@/components/ui/auto-submit-select";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/dates";
import { Link } from "@/i18n/navigation";
import {
  listAdminApplications,
  parseAdminApplicationFilters,
  type AdminApplicationRow,
} from "@/server/admin/applications";

/** Instructor applications queue (P05-T03). Pending first, oldest submission first. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Admin" });
  return { title: t("applicationsTitle") };
}

export default async function AdminApplicationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const filters = parseAdminApplicationFilters(await searchParams);
  const [result, t] = await Promise.all([
    listAdminApplications(filters),
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

  const statusLabel = (status: AdminApplicationRow["status"]): string =>
    status === "APPROVED"
      ? t("applicationApproved")
      : status === "REJECTED"
        ? t("applicationRejected")
        : t("applicationPending");

  const columns: AdminColumn<AdminApplicationRow>[] = [
    {
      key: "applicant",
      label: t("colApplicant"),
      render: (row) => (
        <div>
          <p className="font-medium text-foreground">{row.applicantName}</p>
          <p className="text-xs text-muted-foreground" dir="ltr">
            {row.applicantEmail}
          </p>
        </div>
      ),
      csv: (row) => `${row.applicantName} <${row.applicantEmail}>`,
    },
    {
      key: "field",
      label: t("colField"),
      sortable: true,
      render: (row) => row.field,
      csv: (row) => row.field,
    },
    {
      key: "experience",
      label: t("colExperience"),
      render: (row) => (
        <p className="max-w-72 text-sm text-muted-foreground">{`${row.experience.slice(0, 120)}…`}</p>
      ),
      csv: (row) => row.experience,
    },
    {
      key: "status",
      label: t("colStatus"),
      sortable: true,
      render: (row) => (
        <Badge
          variant={
            row.status === "APPROVED" ? "success" : row.status === "REJECTED" ? "danger" : "warning"
          }
        >
          {statusLabel(row.status)}
        </Badge>
      ),
      csv: (row) => statusLabel(row.status),
    },
    {
      key: "createdAt",
      label: t("colSubmitted"),
      sortable: true,
      render: (row) => formatDate(row.createdAt, localeValue),
      csv: (row) => row.createdAt.toISOString(),
    },
    {
      key: "reviewApplication",
      label: t("reviewApplication"),
      align: "end",
      render: (row) => (
        <Link
          href={`/admin/applications/${row.id}`}
          className="font-medium text-primary hover:underline"
        >
          {t("reviewApplication")}
        </Link>
      ),
      csv: (row) => row.id,
    },
  ];

  return (
    <div>
      <h2 className="font-heading text-xl font-semibold text-foreground">
        {t("applicationsTitle")}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("applicationsSubtitle")}</p>

      <div className="mt-5">
        <AdminDataTable
          columns={columns}
          rows={result.rows}
          total={result.total}
          page={result.page}
          pageCount={result.pageCount}
          query={query}
          basePath="/admin/applications"
          formAction={`/${locale}/admin/applications`}
          searchValue={filters.q}
          searchPlaceholder={t("searchApplicationsPlaceholder")}
          csvHref={`/api/admin/applications/export?${csvParams}&lang=${localeValue}`}
          filterLabel={t("filterLabel")}
          filters={
            <div className="space-y-1">
              <Label htmlFor="filter-application-status">{t("status")}</Label>
              <AutoSubmitSelect
                id="filter-application-status"
                name="status"
                defaultValue={filters.status}
                containerClassName="w-auto"
                className="h-9 pe-8 text-sm"
              >
                <option value="ALL">{t("allApplicationStatuses")}</option>
                <option value="PENDING">{t("applicationPending")}</option>
                <option value="APPROVED">{t("applicationApproved")}</option>
                <option value="REJECTED">{t("applicationRejected")}</option>
              </AutoSubmitSelect>
            </div>
          }
        />
      </div>
    </div>
  );
}
