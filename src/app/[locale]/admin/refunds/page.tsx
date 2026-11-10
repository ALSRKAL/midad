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
  listAdminRefunds,
  parseAdminRefundFilters,
  type AdminRefundRow,
} from "@/server/admin/refunds";

/** Admin refund queue (P10-T03): request first, then Stripe execution and ledger reversal. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Admin" });
  return { title: t("refundsTitle") };
}

export default async function AdminRefundsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const raw = (await searchParams) as Record<string, string>;
  const filters = parseAdminRefundFilters(raw);
  const [result, t] = await Promise.all([
    listAdminRefunds(filters),
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

  const statusLabel = (status: AdminRefundRow["status"]): string =>
    status === "REQUESTED"
      ? t("refundStatusRequested")
      : status === "APPROVED"
        ? t("refundStatusApproved")
        : status === "COMPLETED"
          ? t("refundStatusCompleted")
          : t("refundStatusRejected");

  const columns: AdminColumn<AdminRefundRow>[] = [
    {
      key: "learner",
      label: t("colLearner"),
      render: (row) => (
        <div>
          <p className="font-medium text-foreground">{row.learnerName}</p>
          <p className="text-xs text-muted-foreground" dir="ltr">
            {row.learnerEmail}
          </p>
        </div>
      ),
      csv: (row) => `${row.learnerName} <${row.learnerEmail}>`,
    },
    {
      key: "order",
      label: t("colOrder"),
      render: (row) => <span dir="ltr">{row.orderId}</span>,
      csv: (row) => row.orderId,
    },
    {
      key: "courses",
      label: t("colCourses"),
      render: (row) => (
        <p className="max-w-64 text-sm text-muted-foreground">{row.courses.join("، ")}</p>
      ),
      csv: (row) => row.courses.join(" | "),
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
          )}
        </span>
      ),
      csv: (row) => row.amountCents,
    },
    {
      key: "status",
      label: t("colRefundStatus"),
      sortable: true,
      render: (row) => (
        <Badge
          variant={
            row.status === "COMPLETED"
              ? "success"
              : row.status === "REJECTED"
                ? "danger"
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
      label: t("colRequested"),
      sortable: true,
      render: (row) => formatDate(row.createdAt, localeValue),
      csv: (row) => row.createdAt.toISOString(),
    },
    {
      key: "reviewRefund",
      label: t("reviewRefund"),
      align: "end",
      render: (row) => (
        <Link
          href={`/admin/refunds/${row.id}`}
          className="font-medium text-primary hover:underline"
        >
          {t("reviewRefund")}
        </Link>
      ),
      csv: (row) => row.id,
    },
  ];

  return (
    <div>
      <h2 className="font-heading text-xl font-semibold text-foreground">{t("refundsTitle")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("refundsSubtitle")}</p>

      <div className="mt-5">
        <AdminDataTable
          columns={columns}
          rows={result.rows}
          total={result.total}
          page={result.page}
          pageCount={result.pageCount}
          query={query}
          basePath="/admin/refunds"
          formAction={`/${locale}/admin/refunds`}
          searchValue={filters.q}
          searchPlaceholder={t("searchRefundsPlaceholder")}
          csvHref={`/api/admin/refunds/export?${csvParams}&lang=${localeValue}`}
          filterLabel={t("filterLabel")}
          filters={
            <div className="space-y-1">
              <Label htmlFor="filter-refund-status">{t("colRefundStatus")}</Label>
              <AutoSubmitSelect
                id="filter-refund-status"
                name="status"
                defaultValue={filters.status}
                containerClassName="w-auto"
                className="h-9 pe-8 text-sm"
              >
                <option value="ALL">{t("allRefundStatuses")}</option>
                <option value="REQUESTED">{t("refundStatusRequested")}</option>
                <option value="APPROVED">{t("refundStatusApproved")}</option>
                <option value="REJECTED">{t("refundStatusRejected")}</option>
                <option value="COMPLETED">{t("refundStatusCompleted")}</option>
              </AutoSubmitSelect>
            </div>
          }
        />
      </div>
    </div>
  );
}
