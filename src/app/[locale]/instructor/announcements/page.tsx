import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AnnouncementForm } from "@/features/announcements/components/announcement-form";
import type { Locale } from "@/config/site";
import { formatDate } from "@/lib/dates";
import { listInstructorAnnouncements } from "@/server/announcements";
import { listCouponCourses } from "@/server/coupons-admin";
import { getCurrentSession } from "@/server/session";

/** Instructor announcements (P09-T04). */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Announcements" });
  return { title: t("title") };
}

export default async function InstructorAnnouncementsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentSession();
  if (user === null) return null;
  const [t, courses, announcements] = await Promise.all([
    getTranslations({ locale, namespace: "Announcements" }),
    listCouponCourses(user),
    listInstructorAnnouncements(user),
  ]);
  const localeValue: Locale = locale === "en" ? "en" : "ar";

  return (
    <div className="min-w-0">
      <h2 className="font-heading text-xl font-semibold text-foreground">{t("title")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>

      <div className="mt-5 space-y-6">
        <AnnouncementForm
          courses={courses.map((course) => ({
            id: course.id,
            titleAr: course.titleAr,
            titleEn: course.titleEn,
          }))}
          locale={localeValue}
        />

        <section
          aria-labelledby="announcements-list"
          className="rounded-md border border-border bg-surface p-5"
        >
          <h2
            id="announcements-list"
            className="font-heading text-lg font-semibold text-foreground"
          >
            {t("list")}
          </h2>
          {announcements.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">{t("empty")}</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {announcements.map((announcement) => (
                <li key={announcement.id} className="py-3">
                  <p className="font-medium text-foreground">{announcement.title}</p>
                  <p className="mt-1 text-sm whitespace-pre-line text-muted-foreground">
                    {announcement.body}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {`${localeValue === "en" ? (announcement.course.titleEn ?? announcement.course.titleAr ?? "") : (announcement.course.titleAr ?? announcement.course.titleEn ?? "")} · ${formatDate(announcement.createdAt, localeValue)}`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
