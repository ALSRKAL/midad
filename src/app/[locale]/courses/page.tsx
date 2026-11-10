import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CourseCard } from "@/components/catalog/course-card";
import { LottiePlayer } from "@/components/shared/lottie-player";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AutoSubmitSelect } from "@/components/ui/auto-submit-select";
import { Link } from "@/i18n/navigation";
import {
  buildCatalogHref,
  EMPTY_CATALOG_FILTERS,
  hasActiveCatalogFilters,
  parseCatalogFilters,
} from "@/lib/catalog-filters";
import { listCatalogCategories, searchCatalog } from "@/server/catalog";
import { openGraphFor, seoAlternates } from "@/lib/seo";
import { publicAssetUrl } from "@/server/storage";

/**
 * Catalog (the product requirements).
 *
 * Server-rendered and URL-driven: search, filters, sort and page all live in search params, and the
 * filter form is a plain GET form. Selects submit on change once JavaScript is available; without
 * it the Apply button does exactly the same thing, so no filter is ever decorative.
 *
 * Search runs against the Arabic-normalised columns with the same folding function used when the
 * seed wrote them, which is why "تصميم" finds "تَصْمِيم".
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Catalog" });
  const localeValue = locale === "en" ? "en" : "ar";
  return {
    title: t("title"),
    description: t("subtitle"),
    // Filters and pages are not canonical: the clean catalog is the indexable URL.
    alternates: seoAlternates(localeValue, "/courses"),
    openGraph: openGraphFor({
      locale: localeValue,
      title: t("title"),
      description: t("subtitle"),
      path: "/courses",
    }),
  };
}

function pageWindow(page: number, pageCount: number): number[] {
  const width = 5;
  let start = Math.max(1, page - Math.floor(width / 2));
  const end = Math.min(pageCount, start + width - 1);
  start = Math.max(1, end - width + 1);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export default async function CoursesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const filters = parseCatalogFilters(await searchParams);
  const [result, categories, t] = await Promise.all([
    searchCatalog(filters),
    listCatalogCategories(),
    getTranslations({ locale, namespace: "Catalog" }),
  ]);

  const localeValue = locale === "en" ? "en" : "ar";
  const resetHref = buildCatalogHref(EMPTY_CATALOG_FILTERS);
  const paginationPages = pageWindow(result.page, result.pageCount);

  return (
    <div className="mx-auto w-full max-w-(--container-page) px-6 py-10">
      <header className="border-b border-border pb-4">
        <h1 className="font-heading text-3xl font-semibold text-foreground">{t("title")}</h1>
        <p className="mt-2 max-w-prose text-muted-foreground">{t("subtitle")}</p>
      </header>

      <form
        method="get"
        action={`/${locale}/courses`}
        className="mt-8 grid gap-8 lg:grid-cols-[17rem_minmax(0,1fr)]"
      >
        <aside
          aria-labelledby="filters-title"
          className="h-fit rounded-md border border-border bg-surface p-5"
        >
          <h2 id="filters-title" className="font-heading text-lg font-semibold text-foreground">
            {t("filtersTitle")}
          </h2>

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="filter-q">{t("searchLabel")}</Label>
              <Input
                id="filter-q"
                name="q"
                type="search"
                defaultValue={filters.q ?? ""}
                placeholder={t("searchPlaceholder")}
                maxLength={120}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-category">{t("category")}</Label>
              <AutoSubmitSelect
                id="filter-category"
                name="category"
                defaultValue={filters.category ?? ""}
              >
                <option value="">{t("allCategories")}</option>
                {categories.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {localeValue === "en" ? category.nameEn : category.nameAr}
                  </option>
                ))}
              </AutoSubmitSelect>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="filter-level">{t("level")}</Label>
                <AutoSubmitSelect id="filter-level" name="level" defaultValue={filters.level ?? ""}>
                  <option value="">{t("allLevels")}</option>
                  <option value="BEGINNER">{t("levelBeginner")}</option>
                  <option value="INTERMEDIATE">{t("levelIntermediate")}</option>
                  <option value="ADVANCED">{t("levelAdvanced")}</option>
                  <option value="ALL_LEVELS">{t("levelAll")}</option>
                </AutoSubmitSelect>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-price">{t("price")}</Label>
                <AutoSubmitSelect id="filter-price" name="price" defaultValue={filters.price ?? ""}>
                  <option value="">{t("allPrices")}</option>
                  <option value="free">{t("priceFree")}</option>
                  <option value="paid">{t("pricePaid")}</option>
                </AutoSubmitSelect>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="filter-rating">{t("rating")}</Label>
                <AutoSubmitSelect
                  id="filter-rating"
                  name="rating"
                  defaultValue={filters.rating === undefined ? "" : String(filters.rating)}
                >
                  <option value="">{t("anyRating")}</option>
                  <option value="4">{t("rating4")}</option>
                  <option value="3">{t("rating3")}</option>
                </AutoSubmitSelect>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-duration">{t("duration")}</Label>
                <AutoSubmitSelect
                  id="filter-duration"
                  name="duration"
                  defaultValue={filters.duration ?? ""}
                >
                  <option value="">{t("anyDuration")}</option>
                  <option value="short">{t("durationShort")}</option>
                  <option value="medium">{t("durationMedium")}</option>
                  <option value="long">{t("durationLong")}</option>
                </AutoSubmitSelect>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-language">{t("language")}</Label>
              <AutoSubmitSelect
                id="filter-language"
                name="language"
                defaultValue={filters.language ?? ""}
              >
                <option value="">{t("anyLanguage")}</option>
                <option value="AR">{t("courseLanguageAr")}</option>
                <option value="EN">{t("courseLanguageEn")}</option>
              </AutoSubmitSelect>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button type="submit">{t("apply")}</Button>
              {hasActiveCatalogFilters(filters) && (
                <Link
                  href={resetHref}
                  className="text-sm text-primary underline-offset-4 hover:underline"
                >
                  {t("reset")}
                </Link>
              )}
            </div>
          </div>
        </aside>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground" role="status">
              {t("resultsCount", { count: result.total })}
            </p>

            <div className="flex items-center gap-2">
              <Label htmlFor="filter-sort" className="text-sm">
                {t("sort")}
              </Label>
              <AutoSubmitSelect
                id="filter-sort"
                name="sort"
                defaultValue={filters.sort}
                containerClassName="w-auto"
                className="h-9 pe-8"
              >
                <option value="newest">{t("sortNewest")}</option>
                <option value="popular">{t("sortPopular")}</option>
                <option value="rating">{t("sortRating")}</option>
                <option value="price-asc">{t("sortPriceAsc")}</option>
                <option value="price-desc">{t("sortPriceDesc")}</option>
              </AutoSubmitSelect>
            </div>
          </div>

          {result.courses.length === 0 ? (
            <div className="mt-10 flex flex-col items-center gap-4 rounded-md border border-border bg-surface px-6 py-12 text-center">
              <LottiePlayer src="/lottie/empty-search.json" width={240} height={180} />
              <div className="max-w-md space-y-2">
                <h2 className="font-heading text-xl font-semibold text-foreground">
                  {t("emptyTitle")}
                </h2>
                <p className="text-sm text-muted-foreground">{t("emptyBody")}</p>
              </div>
              <Link
                href={resetHref}
                className="inline-flex h-9 items-center rounded-md border border-border-strong px-4 text-sm font-medium text-foreground hover:bg-muted"
              >
                {t("reset")}
              </Link>
            </div>
          ) : (
            <>
              <ul className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
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
                  aria-label={t("pageOf", { page: result.page, pageCount: result.pageCount })}
                  className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5"
                >
                  {result.page > 1 ? (
                    <Link
                      href={buildCatalogHref(filters, { page: result.page - 1 })}
                      className="inline-flex h-9 items-center rounded-md border border-border-strong px-4 text-sm font-medium hover:bg-muted"
                    >
                      {t("previousPage")}
                    </Link>
                  ) : (
                    <span className="inline-flex h-9 items-center rounded-md border border-dashed border-border px-4 text-sm text-muted-foreground">
                      {t("previousPage")}
                    </span>
                  )}

                  <span className="text-sm text-muted-foreground">
                    {t("pageOf", { page: result.page, pageCount: result.pageCount })}
                  </span>

                  <div className="hidden items-center gap-1 sm:flex">
                    {paginationPages.map((page) =>
                      page === result.page ? (
                        <span
                          key={page}
                          aria-current="page"
                          className="tabular inline-flex size-9 items-center justify-center rounded-sm bg-primary text-sm font-medium text-primary-foreground"
                        >
                          {page}
                        </span>
                      ) : (
                        <Link
                          key={page}
                          href={buildCatalogHref(filters, { page })}
                          className="tabular inline-flex size-9 items-center justify-center rounded-sm text-sm text-foreground hover:bg-muted"
                        >
                          {page}
                        </Link>
                      ),
                    )}
                  </div>

                  {result.page < result.pageCount ? (
                    <Link
                      href={buildCatalogHref(filters, { page: result.page + 1 })}
                      className="inline-flex h-9 items-center rounded-md border border-border-strong px-4 text-sm font-medium hover:bg-muted"
                    >
                      {t("nextPage")}
                    </Link>
                  ) : (
                    <span className="inline-flex h-9 items-center rounded-md border border-dashed border-border px-4 text-sm text-muted-foreground">
                      {t("nextPage")}
                    </span>
                  )}
                </nav>
              )}
            </>
          )}
        </div>
      </form>
    </div>
  );
}
