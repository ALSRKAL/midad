import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AdminDataTable, type AdminColumn } from "@/components/admin/admin-data-table";
import { Badge } from "@/components/ui/badge";
import { AutoSubmitSelect } from "@/components/ui/auto-submit-select";
import { Label } from "@/components/ui/label";
import { UserActions } from "@/features/admin/components/user-actions";
import { formatDate } from "@/lib/dates";
import { listAdminUsers, parseAdminUserFilters, type AdminUserRow } from "@/server/admin/users";
import { getCurrentSession } from "@/server/session";

/** `/admin/users` (P05-T01). Read-only here; role/ban/impersonation arrive in P05-T03. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Admin" });
  return { title: t("usersTitle") };
}

export default async function AdminUsersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const raw = await searchParams;
  const filters = parseAdminUserFilters(raw);
  const [result, t, session] = await Promise.all([
    listAdminUsers(filters),
    getTranslations({ locale, namespace: "Admin" }),
    getCurrentSession(),
  ]);
  const currentAdminId = session?.id ?? "";
  const localeValue = locale === "en" ? "en" : "ar";

  const query: Record<string, string> = {
    ...(filters.q === "" ? {} : { q: filters.q }),
    ...(filters.role === undefined ? {} : { role: filters.role }),
    ...(filters.status === undefined ? {} : { status: filters.status }),
    sort: filters.sort,
    dir: filters.dir,
  };
  const csvParams = new URLSearchParams(query).toString();

  const roleLabel = (role: AdminUserRow["role"]): string =>
    role === "ADMIN"
      ? t("roleAdmin")
      : role === "INSTRUCTOR"
        ? t("roleInstructor")
        : t("roleStudent");
  const statusLabel = (status: AdminUserRow["status"]): string =>
    status === "BANNED"
      ? t("statusBanned")
      : status === "DELETED"
        ? t("statusDeleted")
        : t("statusActive");

  const columns: AdminColumn<AdminUserRow>[] = [
    {
      key: "name",
      label: t("colUser"),
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium text-foreground">{row.name}</p>
          <p className="text-xs text-muted-foreground" dir="ltr">
            {row.email}
          </p>
          {!row.emailVerified && (
            <span className="mt-1 inline-block text-xs text-warning">{t("unverified")}</span>
          )}
        </div>
      ),
      csv: (row) => row.email,
    },
    {
      key: "role",
      label: t("colRole"),
      sortable: true,
      render: (row) => roleLabel(row.role),
      csv: (row) => roleLabel(row.role),
    },
    {
      key: "status",
      label: t("colStatus"),
      render: (row) => (
        <Badge
          variant={
            row.status === "ACTIVE" ? "success" : row.status === "BANNED" ? "danger" : "neutral"
          }
        >
          {statusLabel(row.status)}
        </Badge>
      ),
      csv: (row) => statusLabel(row.status),
    },
    {
      key: "enrollments",
      label: t("colEnrollments"),
      align: "end",
      render: (row) => <span className="tabular">{row.enrollmentCount}</span>,
      csv: (row) => row.enrollmentCount,
    },
    {
      key: "createdAt",
      label: t("colJoined"),
      sortable: true,
      render: (row) => formatDate(row.createdAt, localeValue),
      csv: (row) => row.createdAt.toISOString(),
    },
    {
      key: "actions",
      label: t("colActions"),
      render: (row) => (
        <UserActions
          userId={row.id}
          name={row.name}
          role={row.role}
          status={row.status}
          isSelf={row.id === currentAdminId}
        />
      ),
      csv: () => "",
    },
  ];

  return (
    <div>
      <h2 className="font-heading text-xl font-semibold text-foreground">{t("usersTitle")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("usersSubtitle")}</p>

      <div className="mt-5">
        <AdminDataTable
          columns={columns}
          rows={result.rows}
          total={result.total}
          page={result.page}
          pageCount={result.pageCount}
          query={query}
          basePath="/admin/users"
          formAction={`/${locale}/admin/users`}
          searchValue={filters.q}
          searchPlaceholder={t("searchUsersPlaceholder")}
          csvHref={`/api/admin/users/export?${csvParams}&lang=${localeValue}`}
          filterLabel={t("filterLabel")}
          filters={
            <>
              <div className="space-y-1">
                <Label htmlFor="filter-role">{t("role")}</Label>
                <AutoSubmitSelect
                  id="filter-role"
                  name="role"
                  defaultValue={filters.role ?? ""}
                  containerClassName="w-auto"
                  className="h-9 pe-8 text-sm"
                >
                  <option value="">{t("allRoles")}</option>
                  <option value="STUDENT">{t("roleStudent")}</option>
                  <option value="INSTRUCTOR">{t("roleInstructor")}</option>
                  <option value="ADMIN">{t("roleAdmin")}</option>
                </AutoSubmitSelect>
              </div>
              <div className="space-y-1">
                <Label htmlFor="filter-status">{t("status")}</Label>
                <AutoSubmitSelect
                  id="filter-status"
                  name="status"
                  defaultValue={filters.status ?? ""}
                  containerClassName="w-auto"
                  className="h-9 pe-8 text-sm"
                >
                  <option value="">{t("allStatuses")}</option>
                  <option value="ACTIVE">{t("statusActive")}</option>
                  <option value="BANNED">{t("statusBanned")}</option>
                  <option value="DELETED">{t("statusDeleted")}</option>
                </AutoSubmitSelect>
              </div>
            </>
          }
        />
      </div>
    </div>
  );
}
