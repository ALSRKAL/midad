import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CategoryIcon } from "@/components/catalog/category-icon";
import { CourseCard } from "@/components/catalog/course-card";
import { RatingStars } from "@/components/catalog/rating-stars";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { intlLocales, type Locale } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/dates";
import { openGraphFor, seoAlternates } from "@/lib/seo";
import type { CatalogCourse } from "@/server/catalog";
import { getHomeData, type HomeInstructor, type HomeReview } from "@/server/home";
import { publicAssetUrl } from "@/server/storage";

/**
 * Home page (the product requirements).
 *
 * Every block is backed by the database: live counters, two course rails ordered by real enrolment
 * and recency, instructors ranked by the students in their published courses, and published reviews.
 * The hero search is a plain GET form with a native suggestion list, so it works before any
 * JavaScript has loaded and lands on the catalog with the query in the URL.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Home" });
  const localeValue: Locale = locale === "en" ? "en" : "ar";
  return {
    title: t("heroEyebrow"),
    description: t("heroBody"),
    alternates: seoAlternates(localeValue, "/"),
    openGraph: openGraphFor({
      locale: localeValue,
      title: t("heroEyebrow"),
      description: t("heroBody"),
      path: "/",
    }),
  };
}

function courseTitle(course: { titleAr: string | null; titleEn: string | null }, locale: Locale) {
  return locale === "en"
    ? (course.titleEn ?? course.titleAr ?? "")
    : (course.titleAr ?? course.titleEn ?? "");
}

function CourseRail({
  title,
  subtitle,
  href,
  viewAll,
  courses,
  locale,
}: {
  title: string;
  subtitle: string;
  href: string;
  viewAll: string;
  courses: CatalogCourse[];
  locale: Locale;
}) {
  if (courses.length === 0) return null;

  return (
    <section aria-labelledby={`rail-${href}`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id={`rail-${href}`} className="font-heading text-2xl font-semibold text-foreground">
            {title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {viewAll}
          <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden="true" />
        </Link>
      </div>

      <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {courses.map((course) => (
          <li key={course.id}>
            <CourseCard
              course={course}
              locale={locale}
              coverUrl={course.coverImageKey === null ? null : publicAssetUrl(course.coverImageKey)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function InstructorCard({ instructor }: { instructor: HomeInstructor }) {
  const t = useTranslations("Home");

  return (
    <Link
      href={`/instructors/${instructor.username}`}
      className="flex h-full flex-col items-center rounded-md border border-border bg-surface p-5 text-center transition-colors duration-150 ease-brand hover:border-border-strong"
    >
      <div className="relative size-16 overflow-hidden rounded-full border border-border bg-muted">
        {instructor.image === null ? (
          <span
            aria-hidden="true"
            className="flex size-full items-center justify-center font-heading text-xl text-muted-foreground"
          >
            {instructor.name.charAt(0)}
          </span>
        ) : (
          <Image
            src={instructor.image}
            alt=""
            width={64}
            height={64}
            unoptimized
            className="size-full object-cover"
          />
        )}
      </div>
      <p className="mt-3 font-medium text-foreground">{instructor.name}</p>
      {instructor.headline !== null && (
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{instructor.headline}</p>
      )}
      <p className="mt-auto pt-3 text-xs text-muted-foreground">
        {`${t("instructorCourses", { count: instructor.courseCount })} · ${t("instructorStudents", {
          count: instructor.studentsCount,
        })}`}
      </p>
      <span className="mt-2 text-xs font-medium text-primary">{t("viewProfile")}</span>
    </Link>
  );
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const localeValue: Locale = locale === "en" ? "en" : "ar";
  const [t, data] = await Promise.all([
    getTranslations({ locale, namespace: "Home" }),
    getHomeData(),
  ]);

  const number = (value: number) => new Intl.NumberFormat(intlLocales[localeValue]).format(value);

  const stats = [
    { value: data.stats.publishedCourses, label: t("statCourses") },
    { value: data.stats.learners, label: t("statLearners") },
    { value: data.stats.instructors, label: t("statInstructors") },
    { value: data.stats.certificates, label: t("statCertificates") },
  ];

  return (
    <div>
      <section className="border-b border-border bg-surface">
        <div className="mx-auto grid w-full max-w-(--container-page) gap-10 px-6 py-12 lg:grid-cols-[1.15fr_1fr] lg:py-16">
          <div>
            <p className="text-sm font-medium text-primary">{t("heroEyebrow")}</p>
            <h1 className="mt-3 max-w-2xl font-heading text-4xl leading-tight font-semibold text-foreground sm:text-5xl">
              {t("heroTitle")}
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground">{t("heroBody")}</p>

            <form
              action={`/${locale}/courses`}
              method="get"
              role="search"
              className="mt-6 flex max-w-xl flex-col gap-2 sm:flex-row"
            >
              <div className="relative flex-1">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  type="search"
                  name="q"
                  list="home-course-suggestions"
                  aria-label={t("searchLabel")}
                  placeholder={t("searchPlaceholder")}
                  maxLength={120}
                  className="h-11 ps-10"
                />
                <datalist id="home-course-suggestions">
                  {data.suggestions.map((suggestion) => (
                    <option key={suggestion.slug} value={courseTitle(suggestion, localeValue)} />
                  ))}
                </datalist>
              </div>
              <Button type="submit" className="h-11">
                {t("searchButton")}
              </Button>
            </form>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <Link href="/courses" className="font-medium text-primary hover:underline">
                {t("browseAll")}
              </Link>
              <Link
                href="/courses?price=free"
                className="text-muted-foreground hover:text-foreground hover:underline"
              >
                {t("freeCourses")}
              </Link>
              <Link
                href="/teach"
                className="text-muted-foreground hover:text-foreground hover:underline"
              >
                {t("teachLink")}
              </Link>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-3 self-center">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-md border border-border bg-background p-5">
                <dt className="text-sm text-muted-foreground">{stat.label}</dt>
                <dd
                  className="tabular mt-1 font-heading text-3xl font-semibold text-foreground"
                  dir="ltr"
                >
                  {number(stat.value)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="mx-auto w-full max-w-(--container-page) space-y-14 px-6 py-12">
        <section aria-labelledby="categories-title">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2
                id="categories-title"
                className="font-heading text-2xl font-semibold text-foreground"
              >
                {t("categoriesTitle")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("categoriesSubtitle")}</p>
            </div>
            <Link
              href="/courses"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              {t("browseAll")}
              <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden="true" />
            </Link>
          </div>

          <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {data.categories.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/courses?category=${category.slug}`}
                  className="flex h-full items-start gap-3 rounded-md border border-border bg-surface p-4 transition-colors duration-150 ease-brand hover:border-border-strong"
                >
                  <span className="rounded-sm bg-muted p-2 text-primary">
                    <CategoryIcon name={category.icon} className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-medium break-words text-foreground">
                      {localeValue === "en" ? category.nameEn : category.nameAr}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {t("categoryCourses", { count: category.courseCount })}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <CourseRail
          title={t("bestTitle")}
          subtitle={t("bestSubtitle")}
          href="/courses?sort=popular"
          viewAll={t("viewAll")}
          courses={data.bestSellers}
          locale={localeValue}
        />

        <CourseRail
          title={t("newestTitle")}
          subtitle={t("newestSubtitle")}
          href="/courses?sort=newest"
          viewAll={t("viewAll")}
          courses={data.newest}
          locale={localeValue}
        />

        <section aria-labelledby="instructors-title">
          <div>
            <h2
              id="instructors-title"
              className="font-heading text-2xl font-semibold text-foreground"
            >
              {t("instructorsTitle")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("instructorsSubtitle")}</p>
          </div>
          <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {data.instructors.map((instructor) => (
              <li key={instructor.username}>
                <InstructorCard instructor={instructor} />
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="reviews-title">
          <div>
            <h2 id="reviews-title" className="font-heading text-2xl font-semibold text-foreground">
              {t("reviewsTitle")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("reviewsSubtitle")}</p>
          </div>
          <ul className="mt-5 grid gap-5 md:grid-cols-3">
            {data.reviews.map((review: HomeReview) => (
              <li key={review.id}>
                <figure className="flex h-full flex-col rounded-md border border-border bg-surface p-5">
                  <RatingStars
                    ratingAvg={review.rating * 100}
                    ratingCount={1}
                    locale={localeValue}
                    label={t("reviewStars", { rating: review.rating })}
                    showCount={false}
                  />
                  <blockquote className="mt-3 flex-1 text-sm text-foreground">
                    <p>{review.body}</p>
                  </blockquote>
                  <figcaption className="mt-4 border-t border-border pt-3 text-sm">
                    <span className="font-medium text-foreground">{review.authorName}</span>
                    <Link
                      href={`/courses/${review.courseSlug}`}
                      className="mt-1 block text-muted-foreground hover:text-foreground hover:underline"
                    >
                      {t("reviewOn", {
                        title:
                          localeValue === "en"
                            ? (review.courseTitleEn ?? review.courseTitleAr ?? "")
                            : (review.courseTitleAr ?? review.courseTitleEn ?? ""),
                      })}
                    </Link>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {formatDate(review.createdAt, localeValue)}
                    </span>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-md border border-border bg-surface p-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-xl">
              <h2 className="font-heading text-2xl font-semibold text-foreground">
                {t("teachTitle")}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">{t("teachBody")}</p>
            </div>
            <Button asChild size="lg">
              <Link href="/teach">{t("teachButton")}</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
