import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AdminDataTable, type AdminColumn } from "@/components/admin/admin-data-table";
import { Badge } from "@/components/ui/badge";
import { AutoSubmitSelect } from "@/components/ui/auto-submit-select";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { listAdminOrders, parseAdminOrderFilters, type AdminOrderRow } from "@/server/admin/orders";

/** Admin orders (P10-T04). */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Admin" });
  return { title: t("ordersTitle") };
}

export default async function AdminOrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const filters = parseAdminOrderFilters((await searchParams) as Record<string, string>);
  const [result, t] = await Promise.all([
    listAdminOrders(filters),
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

  const statusLabel = (status: AdminOrderRow["status"]): string => {
    if (status === "PAID") return t("orderStatusPaid");
    if (status === "PENDING") return t("orderStatusPending");
    if (status === "FAILED") return t("orderStatusFailed");
    if (status === "CANCELLED") return t("orderStatusCancelled");
    if (status === "REFUNDED") return t("orderStatusRefunded");
    return t("orderStatusPartiallyRefunded");
  };

  const columns: AdminColumn<AdminOrderRow>[] = [
    {
      key: "learner",
      label: t("colLearner"),
      render: (row) => (
        <div>
          <p className="font-medium text-foreground">{row.userName}</p>
          <p className="text-xs text-muted-foreground" dir="ltr">
            {row.userEmail}
          </p>
        </div>
      ),
      csv: (row) => `${row.userName} <${row.userEmail}>`,
    },
    {
      key: "order",
      label: t("colOrder"),
      render: (row) => (
        <span className="text-sm text-foreground" dir="ltr">
          {row.id}
        </span>
      ),
      csv: (row) => row.id,
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
      key: "totalCents",
      label: t("colAmount"),
      sortable: true,
      align: "end",
      render: (row) => (
        <span className="tabular" dir="ltr">
          {formatMoney(
            { amount: row.totalCents, currency: row.currency === "USD" ? "USD" : "SAR" },
            localeValue,
          )}
        </span>
      ),
      csv: (row) => row.totalCents,
    },
    {
      key: "status",
      label: t("colOrderStatus"),
      sortable: true,
      render: (row) => (
        <Badge
          variant={
            row.status === "PAID"
              ? "success"
              : row.status === "PENDING"
                ? "warning"
                : row.status === "REFUNDED"
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
      key: "createdAt",
      label: t("colCreated"),
      sortable: true,
      render: (row) => formatDate(row.createdAt, localeValue),
      csv: (row) => row.createdAt.toISOString(),
    },
    {
      key: "refund",
      label: t("colRefundStatus"),
      render: (row) =>
        row.refundStatus === null ? (
          <span className="text-xs text-muted-foreground">{t("noReference")}</span>
        ) : (
          <Badge variant={row.refundStatus === "COMPLETED" ? "danger" : "warning"}>
            {row.refundStatus === "COMPLETED"
              ? t("refundStatusCompleted")
              : row.refundStatus === "REJECTED"
                ? t("refundStatusRejected")
                : row.refundStatus === "APPROVED"
                  ? t("refundStatusApproved")
                  : t("refundStatusRequested")}
          </Badge>
        ),
      csv: (row) => row.refundStatus ?? "",
    },
  ];

  return (
    <div>
      <h2 className="font-heading text-xl font-semibold text-foreground">{t("ordersTitle")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("ordersSubtitle")}</p>

      <div className="mt-5">
        <AdminDataTable
          columns={columns}
          rows={result.rows}
          total={result.total}
          page={result.page}
          pageCount={result.pageCount}
          query={query}
          basePath="/admin/orders"
          formAction={`/${locale}/admin/orders`}
          searchValue={filters.q}
          searchPlaceholder={t("searchOrdersPlaceholder")}
          csvHref={`/api/admin/orders/export?${csvParams}&lang=${localeValue}`}
          filterLabel={t("filterLabel")}
          filters={
            <div className="space-y-1">
              <Label htmlFor="filter-order-status">{t("colOrderStatus")}</Label>
              <AutoSubmitSelect
                id="filter-order-status"
                name="status"
                defaultValue={filters.status}
                containerClassName="w-auto"
                className="h-9 pe-8 text-sm"
              >
                <option value="ALL">{t("allOrderStatuses")}</option>
                <option value="PAID">{t("orderStatusPaid")}</option>
                <option value="PENDING">{t("orderStatusPending")}</option>
                <option value="FAILED">{t("orderStatusFailed")}</option>
                <option value="CANCELLED">{t("orderStatusCancelled")}</option>
                <option value="REFUNDED">{t("orderStatusRefunded")}</option>
                <option value="PARTIALLY_REFUNDED">{t("orderStatusPartiallyRefunded")}</option>
              </AutoSubmitSelect>
            </div>
          }
        />
      </div>
    </div>
  );
}
