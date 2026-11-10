import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AdminDataTable, type AdminColumn } from "@/components/admin/admin-data-table";
import { Badge } from "@/components/ui/badge";
import { CategoryActions } from "@/features/admin/components/category-actions";
import { CategoryCreateForm } from "@/features/admin/components/category-form";
import { listAdminCategories, type AdminCategoryRow } from "@/server/admin/categories";

/** Categories CRUD (P05-T04). The table is searchable and sortable; create/edit/delete are real. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Admin" });
  return { title: t("categoriesTitle") };
}

export default async function AdminCategoriesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const raw = await searchParams;
  const q = typeof raw.q === "string" ? raw.q : "";
  const sort = raw.sort === "nameAr" || raw.sort === "sortOrder" ? raw.sort : "sortOrder";
  const dir = raw.dir === "desc" ? "desc" : "asc";

  const [categories, t] = await Promise.all([
    listAdminCategories(q),
    getTranslations({ locale, namespace: "Admin" }),
  ]);
  const localeValue = locale === "en" ? "en" : "ar";

  // Sorting is applied here because the set is small and always fully loaded.
  const sorted = [...categories].sort((a, b) => {
    const direction = dir === "asc" ? 1 : -1;
    if (sort === "nameAr") return a.nameAr.localeCompare(b.nameAr, "ar") * direction;
    return (a.sortOrder - b.sortOrder) * direction;
  });

  const query: Record<string, string> = {
    ...(q === "" ? {} : { q }),
    sort,
    dir,
  };

  const columns: AdminColumn<AdminCategoryRow>[] = [
    {
      key: "nameAr",
      label: t("colCourse"),
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium text-foreground">
            {localeValue === "en" ? row.nameEn : row.nameAr}
          </p>
          <p className="text-xs text-muted-foreground">
            {localeValue === "en" ? row.nameAr : row.nameEn}
          </p>
        </div>
      ),
      csv: (row) => (localeValue === "en" ? row.nameEn : row.nameAr),
    },
    {
      key: "slug",
      label: t("categorySlug"),
      render: (row) => (
        <span className="font-mono text-xs" dir="ltr">
          {row.slug}
        </span>
      ),
      csv: (row) => row.slug,
    },
    {
      key: "icon",
      label: t("categoryIcon"),
      render: (row) => row.icon ?? "—",
      csv: (row) => row.icon ?? "",
    },
    {
      key: "sortOrder",
      label: t("categoryOrder"),
      sortable: true,
      align: "end",
      render: (row) => <span className="tabular">{row.sortOrder}</span>,
      csv: (row) => row.sortOrder,
    },
    {
      key: "isActive",
      label: t("categoryActive"),
      render: (row) => (
        <Badge variant={row.isActive ? "success" : "neutral"}>
          {row.isActive ? t("statusActive") : t("categoryInactive")}
        </Badge>
      ),
      csv: (row) => (row.isActive ? "1" : "0"),
    },
    {
      key: "courseCount",
      label: t("categoryCourses"),
      align: "end",
      render: (row) => <span className="tabular">{row.courseCount}</span>,
      csv: (row) => row.courseCount,
    },
    {
      key: "actions",
      label: t("colActions"),
      render: (row) => <CategoryActions category={row} />,
      csv: () => "",
    },
  ];

  return (
    <div>
      <h2 className="font-heading text-xl font-semibold text-foreground">{t("categoriesTitle")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("categoriesSubtitle")}</p>

      <div className="mt-5">
        <CategoryCreateForm />
      </div>

      <div className="mt-6">
        <AdminDataTable
          columns={columns}
          rows={sorted}
          total={sorted.length}
          page={1}
          pageCount={1}
          query={query}
          basePath="/admin/categories"
          formAction={`/${locale}/admin/categories`}
          searchValue={q}
          searchPlaceholder={t("searchCategories")}
          csvHref={`/api/admin/categories/export?lang=${localeValue}`}
          filterLabel={t("filterLabel")}
        />
      </div>
    </div>
  );
}
