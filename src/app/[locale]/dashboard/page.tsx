import type { Metadata } from "next";
import Image from "next/image";
import { Award, BookOpen, Flame, Heart, PlayCircle, Receipt } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import type { Locale } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { formatDurationLabel } from "@/lib/progress";
import { getStudentDashboard } from "@/server/dashboard";
import { getCurrentSession } from "@/server/session";
import { publicAssetUrl } from "@/server/storage";

/** Student dashboard (P07-T01): resume point, progress, streak, certificates and shortcuts. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Learning" });
  return { title: t("dashboardTitle"), robots: { index: false, follow: false } };
}

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentSession();
  if (user === null) {
    redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/dashboard`)}`);
  }

  const [t, data] = await Promise.all([
    getTranslations({ locale, namespace: "Learning" }),
    getStudentDashboard(user.id),
  ]);
  const localeValue: Locale = locale === "en" ? "en" : "ar";

  const courseTitle = (course: { titleAr: string | null; titleEn: string | null }) =>
    localeValue === "en"
      ? (course.titleEn ?? course.titleAr ?? "")
      : (course.titleAr ?? course.titleEn ?? "");

  return (
    <div className="mx-auto w-full max-w-(--container-page) px-6 py-10">
      <header>
        <h1 className="font-heading text-3xl font-semibold text-foreground">
          {t("dashboardTitle")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("dashboardSubtitle")}</p>
      </header>

      <section
        aria-labelledby="resume-title"
        className="mt-8 rounded-md border border-border bg-surface p-6"
      >
        <h2 id="resume-title" className="font-heading text-xl font-semibold text-foreground">
          {t("resumeTitle")}
        </h2>
        {data.resume === null ? (
          <>
            <p className="mt-2 text-sm font-medium text-foreground">{t("noResumeTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("noResumeBody")}</p>
            <Button asChild className="mt-4">
              <Link href="/courses">{t("browseCourses")}</Link>
            </Button>
          </>
        ) : (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {t("resumeLesson", {
                  course: courseTitle({
                    titleAr: data.resume.courseTitleAr,
                    titleEn: data.resume.courseTitleEn,
                  }),
                  lesson:
                    localeValue === "en" ? data.resume.lessonTitleEn : data.resume.lessonTitleAr,
                })}
              </p>
              {data.resume.positionSec > 0 && data.resume.lessonType === "VIDEO" && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("resumeAt", { time: formatDurationLabel(data.resume.positionSec) })}
                </p>
              )}
            </div>
            <Button asChild>
              <Link href={`/learn/${data.resume.courseSlug}/${data.resume.lessonId}`}>
                <PlayCircle className="size-4" aria-hidden="true" />
                {t("resumeAction")}
              </Link>
            </Button>
          </div>
        )}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-labelledby="my-courses-title">
          <h2 id="my-courses-title" className="font-heading text-xl font-semibold text-foreground">
            {t("myCoursesTitle")}
          </h2>
          {data.courses.length === 0 ? (
            <p className="mt-3 rounded-md border border-border bg-surface p-6 text-sm text-muted-foreground">
              {t("myCoursesEmpty")}
            </p>
          ) : (
            <ul className="mt-3 grid gap-4 sm:grid-cols-2">
              {data.courses.map((course) => {
                const title = courseTitle(course);
                const cover =
                  course.coverImageKey === null ? null : publicAssetUrl(course.coverImageKey);
                return (
                  <li key={course.enrollmentId}>
                    <Link
                      href={`/courses/${course.slug}`}
                      className="flex h-full flex-col rounded-md border border-border bg-surface p-3 transition-colors hover:border-border-strong"
                    >
                      <div className="relative aspect-video overflow-hidden rounded-sm bg-muted">
                        {cover === null ? (
                          <span className="flex size-full items-center justify-center font-heading text-2xl text-muted-foreground">
                            {title.charAt(0)}
                          </span>
                        ) : (
                          <Image src={cover} alt="" fill sizes="360px" className="object-cover" />
                        )}
                      </div>
                      <h3 className="mt-3 line-clamp-2 font-heading text-lg text-foreground">
                        {title}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">{course.instructorName}</p>
                      <div className="mt-3">
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${course.progressPct}%` }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t("courseProgress", { pct: course.progressPct })}
                        </p>
                      </div>
                      {course.certificateCode !== null && (
                        <p className="mt-2 flex items-center gap-1 text-xs font-medium text-success">
                          <Award className="size-3.5" aria-hidden="true" />
                          {t("certificateBadge", { code: course.certificateCode })}
                        </p>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside className="space-y-4">
          <section
            aria-labelledby="streak-title"
            className="rounded-md border border-border bg-surface p-5"
          >
            <h2
              id="streak-title"
              className="flex items-center gap-2 font-heading text-lg font-semibold text-foreground"
            >
              <Flame className="size-5 text-accent-strong" aria-hidden="true" />
              {t("streakTitle")}
            </h2>
            <p className="mt-3 font-heading text-3xl font-semibold text-foreground">
              {t("streakCurrent", { days: data.streak.current })}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("streakLongest", { days: data.streak.longest })}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">{t("streakHint")}</p>
          </section>

          <section className="rounded-md border border-border bg-surface p-5">
            <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-foreground">
              <Heart className="size-5 text-danger" aria-hidden="true" />
              {t("wishlistCard")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("wishlistCount", { count: data.wishlistCount })}
            </p>
            <Link
              href="/wishlist"
              className="mt-2 inline-flex text-sm font-medium text-primary hover:underline"
            >
              {t("openLink")}
            </Link>
          </section>

          <section className="rounded-md border border-border bg-surface p-5">
            <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-foreground">
              <Receipt className="size-5 text-primary" aria-hidden="true" />
              {t("purchasesCard")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{t("purchasesBody")}</p>
            <Link
              href="/purchases"
              className="mt-2 inline-flex text-sm font-medium text-primary hover:underline"
            >
              {t("openLink")}
            </Link>
          </section>

          <section
            aria-labelledby="certificates-title"
            className="rounded-md border border-border bg-surface p-5"
          >
            <h2
              id="certificates-title"
              className="flex items-center gap-2 font-heading text-lg font-semibold text-foreground"
            >
              <Award className="size-5 text-success" aria-hidden="true" />
              {t("certificatesTitle")}
            </h2>
            {data.certificates.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">{t("certificatesEmpty")}</p>
            ) : (
              <ul className="mt-2 space-y-2 text-sm">
                {data.certificates.map((certificate) => (
                  <li key={certificate.code} className="text-foreground">
                    <Link
                      href={`/verify/${certificate.code}`}
                      className="hover:text-primary hover:underline"
                    >
                      {courseTitle({
                        titleAr: certificate.courseTitleAr,
                        titleEn: certificate.courseTitleEn,
                      })}
                      <span className="ms-2 text-xs text-muted-foreground" dir="ltr">
                        {certificate.code}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-md border border-border bg-surface p-5">
            <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-foreground">
              <BookOpen className="size-5 text-primary" aria-hidden="true" />
              {t("browseCourses")}
            </h2>
            <Button asChild variant="secondary" className="mt-3 w-full">
              <Link href="/courses">{t("browseCourses")}</Link>
            </Button>
          </section>
        </aside>
      </div>
    </div>
  );
}
