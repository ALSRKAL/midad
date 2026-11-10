import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AdminDataTable, type AdminColumn } from "@/components/admin/admin-data-table";
import { Badge } from "@/components/ui/badge";
import { AutoSubmitSelect } from "@/components/ui/auto-submit-select";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import {
  listAdminPayouts,
  parseAdminPayoutFilters,
  type AdminPayoutRow,
} from "@/server/admin/payouts";

/** Admin payout queue (P10-T04, BR-13). */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Admin" });
  return { title: t("payoutsTitle") };
}

export default async function AdminPayoutsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const filters = parseAdminPayoutFilters((await searchParams) as Record<string, string>);
  const [result, t] = await Promise.all([
    listAdminPayouts(filters),
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

  const statusLabel = (status: AdminPayoutRow["status"]): string =>
    status === "REQUESTED"
      ? t("payoutStatusRequested")
      : status === "APPROVED"
        ? t("payoutStatusApproved")
        : status === "PAID"
          ? t("payoutStatusPaid")
          : t("payoutStatusRejected");

  const columns: AdminColumn<AdminPayoutRow>[] = [
    {
      key: "instructor",
      label: t("colInstructor"),
      render: (row) => (
        <div>
          <p className="font-medium text-foreground">{row.instructorName}</p>
          <p className="text-xs text-muted-foreground" dir="ltr">
            {row.instructorEmail}
          </p>
        </div>
      ),
      csv: (row) => `${row.instructorName} <${row.instructorEmail}>`,
    },
    {
      key: "amountCents",
      label: t("colAmount"),
      sortable: true,
      align: "end",
      render: (row) => (
        <span className="tabular" dir="ltr">
          {formatMoney(
            { amount: row.amountCents, currency: row.currency === "USD" ? "USD" : "SAR" },
            localeValue,
            { showDecimals: true },
          )}
        </span>
      ),
      csv: (row) => row.amountCents,
    },
    {
      key: "status",
      label: t("colPayoutStatus"),
      sortable: true,
      render: (row) => (
        <Badge
          variant={
            row.status === "PAID" ? "success" : row.status === "REJECTED" ? "danger" : "warning"
          }
        >
          {statusLabel(row.status)}
        </Badge>
      ),
      csv: (row) => statusLabel(row.status),
    },
    {
      key: "reference",
      label: t("colReference"),
      render: (row) => (
        <span className="text-sm text-muted-foreground" dir="ltr">
          {row.transferReference ?? t("noReference")}
        </span>
      ),
      csv: (row) => row.transferReference ?? "",
    },
    {
      key: "createdAt",
      label: t("colRequested"),
      sortable: true,
      render: (row) => formatDate(row.createdAt, localeValue),
      csv: (row) => row.createdAt.toISOString(),
    },
    {
      key: "reviewPayout",
      label: t("reviewPayout"),
      align: "end",
      render: (row) => (
        <Link
          href={`/admin/payouts/${row.id}`}
          className="font-medium text-primary hover:underline"
        >
          {t("reviewPayout")}
        </Link>
      ),
      csv: (row) => row.id,
    },
  ];

  return (
    <div>
      <h2 className="font-heading text-xl font-semibold text-foreground">{t("payoutsTitle")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("payoutsSubtitle")}</p>

      <div className="mt-5">
        <AdminDataTable
          columns={columns}
          rows={result.rows}
          total={result.total}
          page={result.page}
          pageCount={result.pageCount}
          query={query}
          basePath="/admin/payouts"
          formAction={`/${locale}/admin/payouts`}
          searchValue={filters.q}
          searchPlaceholder={t("searchPayoutsPlaceholder")}
          csvHref={`/api/admin/payouts/export?${csvParams}&lang=${localeValue}`}
          filterLabel={t("filterLabel")}
          filters={
            <div className="space-y-1">
              <Label htmlFor="filter-payout-status">{t("colPayoutStatus")}</Label>
              <AutoSubmitSelect
                id="filter-payout-status"
                name="status"
                defaultValue={filters.status}
                containerClassName="w-auto"
                className="h-9 pe-8 text-sm"
              >
                <option value="ALL">{t("allPayoutStatuses")}</option>
                <option value="REQUESTED">{t("payoutStatusRequested")}</option>
                <option value="APPROVED">{t("payoutStatusApproved")}</option>
                <option value="PAID">{t("payoutStatusPaid")}</option>
                <option value="REJECTED">{t("payoutStatusRejected")}</option>
              </AutoSubmitSelect>
            </div>
          }
        />
      </div>
    </div>
  );
}
