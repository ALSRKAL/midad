import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { CourseDetailView } from "@/components/catalog/course-detail-view";
import type { Locale } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { getCourseDetailById, getSimilarCourses } from "@/server/catalog";
import { getInstructorProfileId } from "@/server/instructor-courses";
import { getCurrentSession } from "@/server/session";

/**
 * Instructor preview "as the learner sees it" (P04-T06).
 *
 * Outside the instructor shell on purpose: the page uses the public header and footer so the
 * instructor sees the real composition. A banner marks it as a preview, the purchase actions are
 * replaced by a notice, and the page is noindex.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Publish" });
  return { title: t("previewLink"), robots: { index: false, follow: false } };
}

export default async function CoursePreviewPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const user = await getCurrentSession();
  if (user === null) notFound();

  const instructorId = await getInstructorProfileId(user.id);
  if (instructorId === null) notFound();

  const [course, t] = await Promise.all([
    getCourseDetailById(instructorId, id),
    getTranslations({ locale, namespace: "Publish" }),
  ]);
  if (course === null) notFound();

  const similar = await getSimilarCourses(course.id, course.category.slug, 3);
  const localeValue: Locale = locale === "en" ? "en" : "ar";

  return (
    <div>
      <div className="border-b border-warning bg-surface">
        <div className="mx-auto flex w-full max-w-(--container-page) flex-wrap items-center justify-between gap-3 px-6 py-3">
          <p className="text-sm text-foreground">{t("previewBanner")}</p>
          <Link
            href={`/instructor/courses/${course.id}/publish`}
            className="text-sm font-medium text-primary hover:underline"
          >
            {t("previewBack")}
          </Link>
        </div>
      </div>

      <div className="mx-auto w-full max-w-(--container-page) px-6 py-8">
        <CourseDetailView
          course={course}
          similar={similar}
          locale={localeValue}
          isAuthenticated
          wishlisted={false}
          preview
        />
      </div>
    </div>
  );
}
