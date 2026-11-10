import type { Metadata } from "next";
import Image from "next/image";
import { Star, Users } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { CourseCard } from "@/components/catalog/course-card";
import type { Locale } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { openGraphFor, seoAlternates } from "@/lib/seo";
import { getInstructorPage } from "@/server/instructors";
import { publicAssetUrl } from "@/server/storage";

/**
 * Public instructor profile (the product requirements / §2.5).
 *
 * Shows the profile the instructor owns and the published courses only. Drafts, rejected courses
 * and any learner data are not part of this page's query.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; username: string }>;
}): Promise<Metadata> {
  const { locale, username } = await params;
  const instructor = await getInstructorPage(username);
  if (instructor === null) return {};
  const localeValue = locale === "en" ? "en" : "ar";
  return {
    title: instructor.name,
    description: instructor.headline ?? undefined,
    alternates: seoAlternates(localeValue, `/instructors/${username}`),
    openGraph: openGraphFor({
      locale: localeValue,
      title: instructor.name,
      description: instructor.headline ?? "",
      path: `/instructors/${username}`,
    }),
  };
}

export default async function InstructorPage({
  params,
}: {
  params: Promise<{ locale: string; username: string }>;
}) {
  const { locale, username } = await params;
  setRequestLocale(locale);

  const instructor = await getInstructorPage(username);
  if (instructor === null) notFound();

  const [t, courseT] = await Promise.all([
    getTranslations({ locale, namespace: "InstructorProfile" }),
    getTranslations({ locale, namespace: "Course" }),
  ]);
  const localeValue: Locale = locale === "en" ? "en" : "ar";
  const bio =
    localeValue === "en"
      ? (instructor.bioEn ?? instructor.bioAr ?? "")
      : (instructor.bioAr ?? instructor.bioEn ?? "");

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
          <li>{instructor.name}</li>
        </ol>
      </nav>

      <header className="mt-5 flex flex-wrap items-start gap-6 rounded-md border border-border bg-surface p-6">
        <div className="relative size-24 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
          {instructor.image === null ? (
            <span
              aria-hidden="true"
              className="flex size-full items-center justify-center font-heading text-3xl text-muted-foreground"
            >
              {instructor.name.charAt(0)}
            </span>
          ) : (
            <Image
              src={instructor.image}
              alt={instructor.name}
              width={96}
              height={96}
              unoptimized
              className="size-full object-cover"
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-primary">{t("eyebrow")}</p>
          <h1 className="mt-1 font-heading text-3xl font-semibold text-foreground">
            {instructor.name}
          </h1>
          {instructor.headline !== null && (
            <p className="mt-1 text-lg text-muted-foreground">{instructor.headline}</p>
          )}
          {bio !== "" && (
            <p className="mt-3 max-w-3xl text-sm whitespace-pre-line text-foreground">{bio}</p>
          )}

          <ul className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <li>{t("statsCourses", { count: instructor.stats.courses })}</li>
            <li className="inline-flex items-center gap-1">
              <Users className="size-4" aria-hidden="true" />
              {t("statsStudents", { count: instructor.stats.students })}
            </li>
            <li className="inline-flex items-center gap-1">
              <Star className="size-4" aria-hidden="true" />
              {t("statsRating", { rating: (instructor.stats.ratingAvg / 100).toFixed(1) })}
            </li>
          </ul>

          {(instructor.websiteUrl !== null ||
            instructor.twitterUrl !== null ||
            instructor.linkedinUrl !== null) && (
            <ul className="mt-4 flex flex-wrap gap-4 text-sm">
              {instructor.websiteUrl !== null && (
                <li>
                  <a
                    href={instructor.websiteUrl}
                    dir="ltr"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {t("website")}
                  </a>
                </li>
              )}
              {instructor.twitterUrl !== null && (
                <li>
                  <a
                    href={instructor.twitterUrl}
                    dir="ltr"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {t("twitter")}
                  </a>
                </li>
              )}
              {instructor.linkedinUrl !== null && (
                <li>
                  <a
                    href={instructor.linkedinUrl}
                    dir="ltr"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {t("linkedin")}
                  </a>
                </li>
              )}
            </ul>
          )}
        </div>
      </header>

      <section aria-labelledby="instructor-courses" className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2
            id="instructor-courses"
            className="font-heading text-2xl font-semibold text-foreground"
          >
            {t("coursesTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("coursesCount", { count: instructor.courses.length })}
          </p>
        </div>

        {instructor.courses.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">{t("noCourses")}</p>
        ) : (
          <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {instructor.courses.map((course) => (
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
        )}
      </section>
    </div>
  );
}
