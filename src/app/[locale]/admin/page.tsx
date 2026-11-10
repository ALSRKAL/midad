import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AdminAnalyticsCharts } from "@/features/admin/components/admin-analytics-charts";
import { Link } from "@/i18n/navigation";
import { intlLocales } from "@/config/site";
import { ANALYTICS_RANGES, parseAnalyticsRange } from "@/lib/analytics-range";
import { formatMoney } from "@/lib/money";
import { getAdminAnalytics } from "@/server/admin/analytics";
import { getAdminOverview } from "@/server/admin/overview";

/** Admin overview (P05-T01, extended P10-T04). KPI cards and charts read live rows. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Admin" });
  return { title: t("overviewTitle") };
}

export default async function AdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);

  const range = parseAnalyticsRange(query.range);
  const [overview, analytics, t] = await Promise.all([
    getAdminOverview(),
    getAdminAnalytics(range),
    getTranslations({ locale, namespace: "Admin" }),
  ]);
  const localeValue = locale === "en" ? "en" : "ar";
  const number = (value: number) => new Intl.NumberFormat(intlLocales[localeValue]).format(value);
  const rangeLabels = { 7: t("range7"), 30: t("range30"), 90: t("range90") } as const;

  const groups = [
    {
      title: t("usersTitle"),
      cards: [
        { label: t("kpiUsers"), value: number(overview.users.total) },
        { label: t("kpiStudents"), value: number(overview.users.students) },
        { label: t("kpiInstructors"), value: number(overview.users.instructors) },
        { label: t("kpiAdmins"), value: number(overview.users.admins) },
        { label: t("kpiBanned"), value: number(overview.users.banned) },
      ],
    },
    {
      title: t("kpiCourses"),
      cards: [
        { label: t("kpiCourses"), value: number(overview.courses.total) },
        { label: t("kpiPublished"), value: number(overview.courses.published) },
        { label: t("kpiPendingCourses"), value: number(overview.courses.pendingReview) },
        { label: t("kpiEnrollments"), value: number(overview.activeEnrollments) },
        { label: t("kpiCertificates"), value: number(overview.certificates) },
      ],
    },
    {
      title: t("kpiRevenue"),
      cards: [
        {
          label: t("kpiRevenue"),
          value: formatMoney({ amount: overview.revenueCents, currency: "SAR" }, localeValue),
        },
        { label: t("kpiApplications"), value: number(overview.pendingApplications) },
      ],
    },
    {
      title: t("kpiQueues"),
      cards: [
        { label: t("kpiApplications"), value: number(overview.pendingApplications) },
        { label: t("kpiPendingRefunds"), value: number(overview.pendingRefunds) },
        { label: t("kpiPendingPayouts"), value: number(overview.pendingPayouts) },
        { label: t("kpiOpenReports"), value: number(overview.openReports) },
        { label: t("kpiNewMessages"), value: number(overview.newContactMessages) },
      ],
    },
  ];

  return (
    <div>
      <h2 className="font-heading text-xl font-semibold text-foreground">{t("overviewTitle")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("overviewSubtitle")}</p>

      <div className="mt-5 space-y-6">
        {groups.map((group) => (
          <section key={group.title} aria-label={group.title}>
            <h3 className="text-sm font-medium text-muted-foreground">{group.title}</h3>
            <dl className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
              {group.cards.map((card) => (
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
          </section>
        ))}
      </div>

      <section aria-labelledby="admin-analytics-title" className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h3
            id="admin-analytics-title"
            className="font-heading text-lg font-semibold text-foreground"
          >
            {t("adminAnalyticsTitle")}
          </h3>
          <nav aria-label={t("rangeLabel")} className="flex flex-wrap gap-1">
            {ANALYTICS_RANGES.map((value) => {
              const active = value === range;
              return (
                <Link
                  key={value}
                  href={`/admin?range=${value}`}
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
        <AdminAnalyticsCharts points={analytics.series} locale={localeValue} />
      </section>

      <section aria-labelledby="queues-title" className="mt-8">
        <h3 id="queues-title" className="font-heading text-lg font-semibold text-foreground">
          {t("queuesTitle")}
        </h3>
        <ul className="mt-3 flex flex-wrap gap-3 text-sm">
          {[
            { href: "/admin/users", label: t("queueUsers") },
            { href: "/admin/courses", label: t("queueCourses") },
            { href: "/admin/applications", label: t("queueApplications") },
            { href: "/admin/orders", label: t("navOrders") },
            { href: "/admin/refunds", label: t("navRefunds") },
            { href: "/admin/payouts", label: t("navPayouts") },
            { href: "/admin/reports", label: t("navReports") },
            { href: "/admin/messages", label: t("navMessages") },
          ].map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="inline-flex rounded-md border border-border-strong px-4 py-2 font-medium hover:bg-muted"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
