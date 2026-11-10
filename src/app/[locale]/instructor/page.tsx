import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AnalyticsCharts } from "@/features/instructor-analytics/components/analytics-charts";
import { CourseStatusBadge } from "@/features/instructor-builder/components/course-status-badge";
import { CreateCourseButton } from "@/features/instructor-builder/components/create-course-button";
import { NoInstructorProfile } from "@/features/instructor-builder/components/no-instructor-profile";
import { Link } from "@/i18n/navigation";
import { ANALYTICS_RANGES, parseAnalyticsRange } from "@/lib/analytics-range";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import {
  getInstructorProfileId,
  getInstructorStats,
  listInstructorCourses,
} from "@/server/instructor-courses";
import { getInstructorAnalytics } from "@/server/instructor-analytics";
import { getCurrentSession } from "@/server/session";

/** Instructor overview (P04-T01). Counters and the recent list are computed from owned rows only. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "InstructorDashboard" });
  return { title: t("overviewTitle") };
}

export default async function InstructorOverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ range?: string | string[] }>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);

  const user = await getCurrentSession();
  if (user === null) return null;

  const instructorId = await getInstructorProfileId(user.id);
  const t = await getTranslations({ locale, namespace: "InstructorDashboard" });
  const analyticsT = await getTranslations({ locale, namespace: "InstructorAnalytics" });
  const localeValue = locale === "en" ? "en" : "ar";
  const range = parseAnalyticsRange(query.range);

  if (instructorId === null) {
    return (
      <div>
        <h2 className="font-heading text-xl font-semibold text-foreground">{t("overviewTitle")}</h2>
        <div className="mt-4">
          <NoInstructorProfile />
        </div>
      </div>
    );
  }

  const [stats, courses, analytics] = await Promise.all([
    getInstructorStats(instructorId),
    listInstructorCourses(instructorId),
    getInstructorAnalytics(instructorId, range),
  ]);
  const recent = courses.slice(0, 5);

  const courseCards = [
    { label: t("statTotal"), value: String(stats.totalCourses) },
    { label: t("statPublished"), value: String(stats.publishedCourses) },
    { label: t("statPending"), value: String(stats.pendingCourses) },
    { label: t("statStudents"), value: String(stats.totalStudents) },
    {
      label: t("statRating"),
      value: (stats.averageRating / 100).toFixed(1),
    },
  ];

  const analyticsCards = [
    {
      label: analyticsT("revenueLabel"),
      value: formatMoney({ amount: analytics.revenueCents, currency: "SAR" }, localeValue, {
        showDecimals: true,
      }),
      hint: null,
    },
    {
      label: analyticsT("newStudentsLabel"),
      value: String(analytics.newStudents),
      hint: null,
    },
    {
      label: analyticsT("ratingLabel"),
      value: (analytics.averageRatingX100 / 100).toFixed(1),
      hint: analyticsT("ratingCount", { count: analytics.ratingCount }),
    },
    {
      label: analyticsT("completionLabel"),
      value: `${analytics.completionPct}%`,
      hint: analyticsT("completionHint"),
    },
  ];
  const rangeLabels = {
    7: analyticsT("range7"),
    30: analyticsT("range30"),
    90: analyticsT("range90"),
  } as const;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-semibold text-foreground">
            {t("overviewTitle")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("overviewSubtitle")}</p>
        </div>
        <CreateCourseButton />
      </div>

      <section aria-labelledby="analytics-title" className="mt-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 id="analytics-title" className="font-heading text-lg font-semibold text-foreground">
              {analyticsT("title")}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{analyticsT("subtitle")}</p>
          </div>
          <nav aria-label={analyticsT("range")} className="flex flex-wrap gap-1">
            {ANALYTICS_RANGES.map((value) => {
              const active = value === range;
              return (
                <Link
                  key={value}
                  href={`/instructor?range=${value}`}
                  aria-current={active ? "page" : undefined}
                  className={
                    active
                      ? "rounded-sm bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
                      : "rounded-sm border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:border-border-strong"
                  }
                >
                  {rangeLabels[value]}
                </Link>
              );
            })}
          </nav>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {analyticsCards.map((card) => (
            <div key={card.label} className="rounded-md border border-border bg-surface p-4">
              <dt className="text-sm text-muted-foreground">{card.label}</dt>
              <dd className="mt-1">
                <span
                  className="tabular block font-heading text-2xl font-semibold text-foreground"
                  dir="ltr"
                >
                  {card.value}
                </span>
                {card.hint !== null && (
                  <span className="mt-1 block text-xs text-muted-foreground">{card.hint}</span>
                )}
              </dd>
            </div>
          ))}
        </dl>

        <AnalyticsCharts points={analytics.series} locale={localeValue} />
      </section>

      <h3 className="mt-8 font-heading text-lg font-semibold text-foreground">
        {t("courseStatsTitle")}
      </h3>
      <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {courseCards.map((card) => (
          <div key={card.label} className="rounded-md border border-border bg-surface p-4">
            <dt className="text-sm text-muted-foreground">{card.label}</dt>
            <dd
              className="tabular mt-1 font-heading text-2xl font-semibold text-foreground"
              dir="ltr"
            >
              {card.value}
            </dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="recent-courses" className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h3 id="recent-courses" className="font-heading text-lg font-semibold text-foreground">
            {t("recentTitle")}
          </h3>
          {courses.length > 0 && (
            <Link
              href="/instructor/courses"
              className="text-sm font-medium text-primary hover:underline"
            >
              {t("viewAll")}
            </Link>
          )}
        </div>

        {recent.length === 0 ? (
          <div className="mt-4 rounded-md border border-border bg-surface p-6">
            <p className="font-medium text-foreground">{t("emptyTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("emptyBody")}</p>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-border rounded-md border border-border bg-surface">
            {recent.map((course) => {
              const title =
                localeValue === "en"
                  ? (course.titleEn ?? course.titleAr)
                  : (course.titleAr ?? course.titleEn);
              return (
                <li key={course.id} className="flex flex-wrap items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">
                      {title === null || title === "" ? t("untitled") : title}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {`${t("tableUpdated")}: ${formatDate(course.updatedAt, localeValue)}`}
                    </p>
                  </div>
                  <CourseStatusBadge status={course.status} />
                  <Link
                    href={`/instructor/courses/${course.id}/edit`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {t("edit")}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
