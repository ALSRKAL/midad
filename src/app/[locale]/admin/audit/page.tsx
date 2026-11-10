import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AdminDataTable, type AdminColumn } from "@/components/admin/admin-data-table";
import { AutoSubmitSelect } from "@/components/ui/auto-submit-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateTime } from "@/lib/dates";
import {
  listAdminAudit,
  listAuditEntities,
  parseAdminAuditFilters,
  type AdminAuditRow,
} from "@/server/admin/audit";

/** Audit log (P05-T04). Read-only: search, entity filter, action substring, sort and CSV. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Admin" });
  return { title: t("auditTitle") };
}

export default async function AdminAuditPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const filters = parseAdminAuditFilters(await searchParams);
  const [result, entities, t] = await Promise.all([
    listAdminAudit(filters),
    listAuditEntities(),
    getTranslations({ locale, namespace: "Admin" }),
  ]);
  const localeValue = locale === "en" ? "en" : "ar";

  const query: Record<string, string> = {
    ...(filters.q === "" ? {} : { q: filters.q }),
    ...(filters.entity === undefined ? {} : { entity: filters.entity }),
    ...(filters.action === undefined ? {} : { action: filters.action }),
    sort: filters.sort,
    dir: filters.dir,
  };
  const csvParams = new URLSearchParams(query).toString();

  const columns: AdminColumn<AdminAuditRow>[] = [
    {
      key: "createdAt",
      label: t("colWhen"),
      sortable: true,
      render: (row) => (
        <span className="tabular whitespace-nowrap" dir="ltr">
          {formatDateTime(row.createdAt, localeValue)}
        </span>
      ),
      csv: (row) => row.createdAt.toISOString(),
    },
    {
      key: "actor",
      label: t("colActor"),
      render: (row) =>
        row.actorName === null ? (
          <span className="text-muted-foreground">{t("systemActor")}</span>
        ) : (
          <div>
            <p className="text-foreground">{row.actorName}</p>
            <p className="text-xs text-muted-foreground" dir="ltr">
              {row.actorEmail}
            </p>
          </div>
        ),
      csv: (row) => row.actorEmail ?? "system",
    },
    {
      key: "action",
      label: t("colAction"),
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs" dir="ltr">
          {row.action}
        </span>
      ),
      csv: (row) => row.action,
    },
    {
      key: "entity",
      label: t("colEntity"),
      sortable: true,
      render: (row) => (
        <span className="text-sm">
          {row.entity}
          {row.entityId !== null && (
            <span className="ms-1 font-mono text-xs text-muted-foreground" dir="ltr">
              {row.entityId}
            </span>
          )}
        </span>
      ),
      csv: (row) => `${row.entity}:${row.entityId ?? ""}`,
    },
    {
      key: "ip",
      label: t("colIp"),
      render: (row) => (
        <span className="text-xs text-muted-foreground" dir="ltr">
          {row.ip ?? "—"}
        </span>
      ),
      csv: (row) => row.ip ?? "",
    },
  ];

  return (
    <div>
      <h2 className="font-heading text-xl font-semibold text-foreground">{t("auditTitle")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("auditSubtitle")}</p>

      <div className="mt-5">
        <AdminDataTable
          columns={columns}
          rows={result.rows}
          total={result.total}
          page={result.page}
          pageCount={result.pageCount}
          query={query}
          basePath="/admin/audit"
          formAction={`/${locale}/admin/audit`}
          searchValue={filters.q}
          searchPlaceholder={t("searchAudit")}
          csvHref={`/api/admin/audit/export?${csvParams}&lang=${localeValue}`}
          filterLabel={t("filterLabel")}
          filters={
            <>
              <div className="space-y-1">
                <Label htmlFor="audit-entity">{t("auditEntityFilter")}</Label>
                <AutoSubmitSelect
                  id="audit-entity"
                  name="entity"
                  defaultValue={filters.entity ?? ""}
                  containerClassName="w-auto"
                  className="h-9 pe-8 text-sm"
                >
                  <option value="">{t("allEntities")}</option>
                  {entities.map((entity) => (
                    <option key={entity} value={entity}>
                      {entity}
                    </option>
                  ))}
                </AutoSubmitSelect>
              </div>
              <div className="space-y-1">
                <Label htmlFor="audit-action">{t("auditActionFilter")}</Label>
                <Input
                  id="audit-action"
                  name="action"
                  defaultValue={filters.action ?? ""}
                  placeholder={t("auditActionPlaceholder")}
                  className="h-9 w-36 text-sm"
                />
              </div>
            </>
          }
        />
      </div>
    </div>
  );
}
