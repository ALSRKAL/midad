import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AdminDataTable, type AdminColumn } from "@/components/admin/admin-data-table";
import { Badge } from "@/components/ui/badge";
import { AutoSubmitSelect } from "@/components/ui/auto-submit-select";
import { Label } from "@/components/ui/label";
import { ContactMessageActions } from "@/features/admin/components/contact-message-actions";
import { formatDate } from "@/lib/dates";
import {
  listAdminContactMessages,
  parseAdminContactFilters,
  type AdminContactRow,
} from "@/server/admin/contact";

/** Contact inbox (P10-T04). */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Admin" });
  return { title: t("contactTitle") };
}

export default async function AdminContactPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const filters = parseAdminContactFilters((await searchParams) as Record<string, string>);
  const [result, t] = await Promise.all([
    listAdminContactMessages(filters),
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

  const statusLabel = (status: AdminContactRow["status"]) =>
    status === "NEW"
      ? t("contactStatusNew")
      : status === "READ"
        ? t("contactStatusRead")
        : t("contactStatusArchived");

  const columns: AdminColumn<AdminContactRow>[] = [
    {
      key: "sender",
      label: t("contactSender"),
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-foreground">{row.name}</p>
          <p className="text-xs text-muted-foreground" dir="ltr">
            {row.email}
          </p>
        </div>
      ),
      csv: (row) => `${row.name} <${row.email}>`,
    },
    {
      key: "subject",
      label: t("contactSubject"),
      render: (row) => (
        <div className="max-w-80">
          <p className="text-sm font-medium text-foreground">{row.subject}</p>
          <p className="mt-1 text-xs text-muted-foreground">{row.message.slice(0, 180)}</p>
        </div>
      ),
      csv: (row) => `${row.subject}: ${row.message}`,
    },
    {
      key: "status",
      label: t("colStatus"),
      sortable: true,
      render: (row) => (
        <Badge
          variant={row.status === "NEW" ? "warning" : row.status === "READ" ? "success" : "neutral"}
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
      render: (row) => <ContactMessageActions messageId={row.id} status={row.status} />,
      csv: () => "",
    },
  ];

  return (
    <div>
      <h2 className="font-heading text-xl font-semibold text-foreground">{t("contactTitle")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("contactSubtitle")}</p>

      <div className="mt-5">
        <AdminDataTable
          columns={columns}
          rows={result.rows}
          total={result.total}
          page={result.page}
          pageCount={result.pageCount}
          query={query}
          basePath="/admin/messages"
          formAction={`/${locale}/admin/messages`}
          searchValue={filters.q}
          searchPlaceholder={t("contactSearchPlaceholder")}
          csvHref={`/api/admin/contact/export?${csvParams}&lang=${localeValue}`}
          filterLabel={t("filterLabel")}
          filters={
            <div className="space-y-1">
              <Label htmlFor="filter-contact-status">{t("colStatus")}</Label>
              <AutoSubmitSelect
                id="filter-contact-status"
                name="status"
                defaultValue={filters.status}
                containerClassName="w-auto"
                className="h-9 pe-8 text-sm"
              >
                <option value="ALL">{t("contactStatusAll")}</option>
                <option value="NEW">{t("contactStatusNew")}</option>
                <option value="READ">{t("contactStatusRead")}</option>
                <option value="ARCHIVED">{t("contactStatusArchived")}</option>
              </AutoSubmitSelect>
            </div>
          }
        />
      </div>
    </div>
  );
}
