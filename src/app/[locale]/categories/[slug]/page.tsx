import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { CategoryIcon } from "@/components/catalog/category-icon";
import { CourseCard } from "@/components/catalog/course-card";
import { Link } from "@/i18n/navigation";
import { EMPTY_CATALOG_FILTERS } from "@/lib/catalog-filters";
import { openGraphFor, seoAlternates } from "@/lib/seo";
import { getCategoryBySlug } from "@/server/instructors";
import { searchCatalog } from "@/server/catalog";
import { publicAssetUrl } from "@/server/storage";

/**
 * Category page (the product requirements).
 *
 * A real destination for every category link: the same published courses the catalog returns for
 * `?category=slug`, with server-side pagination. Unknown or inactive categories are a 404.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (category === null) return {};
  const t = await getTranslations({ locale, namespace: "Category" });
  const name = locale === "en" ? category.nameEn : category.nameAr;
  const description = t("subtitle", { category: name });
  const localeValue = locale === "en" ? "en" : "ar";
  return {
    title: name,
    description,
    alternates: seoAlternates(localeValue, `/categories/${category.slug}`),
    openGraph: openGraphFor({
      locale: localeValue,
      title: name,
      description,
      path: `/categories/${category.slug}`,
    }),
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const category = await getCategoryBySlug(slug);
  if (category === null) notFound();

  const rawPage = (await searchParams).page;
  const page = typeof rawPage === "string" && /^\d+$/.test(rawPage) ? Number(rawPage) : 1;

  const [result, t, catalogT, courseT] = await Promise.all([
    searchCatalog({ ...EMPTY_CATALOG_FILTERS, category: slug, page }),
    getTranslations({ locale, namespace: "Category" }),
    getTranslations({ locale, namespace: "Catalog" }),
    getTranslations({ locale, namespace: "Course" }),
  ]);

  const localeValue = locale === "en" ? "en" : "ar";
  const name = localeValue === "en" ? category.nameEn : category.nameAr;
  const pageHref = (target: number) =>
    target === 1 ? `/categories/${slug}` : `/categories/${slug}?page=${target}`;

  return (
    <div className="mx-auto w-full max-w-(--container-page) px-6 py-8">
      <nav aria-label={courseT("breadcrumbLabel")} className="text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="hover:text-foreground hover:underline">
              {courseT("breadcrumbHome")}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/courses" className="hover:text-foreground hover:underline">
              {courseT("breadcrumbCourses")}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>{name}</li>
        </ol>
      </nav>

      <header className="mt-5 flex flex-wrap items-center gap-4 border-b border-border pb-5">
        <span className="rounded-md bg-muted p-3 text-primary">
          <CategoryIcon name={category.icon} className="size-6" />
        </span>
        <div>
          <p className="text-sm font-medium text-primary">{t("eyebrow")}</p>
          <h1 className="font-heading text-3xl font-semibold text-foreground">{name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle", { category: name })}</p>
        </div>
      </header>

      {result.courses.length === 0 ? (
        <div className="mt-10 rounded-md border border-border bg-surface p-8 text-center">
          <h2 className="font-heading text-xl font-semibold text-foreground">{t("emptyTitle")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("emptyBody")}</p>
          <Link
            href="/courses"
            className="mt-4 inline-flex h-9 items-center rounded-md border border-border-strong px-4 text-sm font-medium hover:bg-muted"
          >
            {catalogT("title")}
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {result.courses.map((course) => (
              <li key={course.id}>
                <CourseCard
                  course={course}
                  locale={localeValue}
                  coverUrl={
                    course.coverImageKey === null ? null : publicAssetUrl(course.coverImageKey)
                  }
                />
              </li>
            ))}
          </ul>

          {result.pageCount > 1 && (
            <nav
              aria-label={catalogT("pageOf", { page: result.page, pageCount: result.pageCount })}
              className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-5"
            >
              {result.page > 1 ? (
                <Link
                  href={pageHref(result.page - 1)}
                  className="inline-flex h-9 items-center rounded-md border border-border-strong px-4 text-sm font-medium hover:bg-muted"
                >
                  {catalogT("previousPage")}
                </Link>
              ) : (
                <span className="inline-flex h-9 items-center rounded-md border border-dashed border-border px-4 text-sm text-muted-foreground">
                  {catalogT("previousPage")}
                </span>
              )}
              <span className="text-sm text-muted-foreground">
                {catalogT("pageOf", { page: result.page, pageCount: result.pageCount })}
              </span>
              {result.page < result.pageCount ? (
                <Link
                  href={pageHref(result.page + 1)}
                  className="inline-flex h-9 items-center rounded-md border border-border-strong px-4 text-sm font-medium hover:bg-muted"
                >
                  {catalogT("nextPage")}
                </Link>
              ) : (
                <span className="inline-flex h-9 items-center rounded-md border border-dashed border-border px-4 text-sm text-muted-foreground">
                  {catalogT("nextPage")}
                </span>
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
