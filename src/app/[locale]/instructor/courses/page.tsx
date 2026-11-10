import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CourseStatusBadge } from "@/features/instructor-builder/components/course-status-badge";
import { CreateCourseButton } from "@/features/instructor-builder/components/create-course-button";
import { NoInstructorProfile } from "@/features/instructor-builder/components/no-instructor-profile";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/dates";
import { getInstructorProfileId, listInstructorCourses } from "@/server/instructor-courses";
import { getCurrentSession } from "@/server/session";

/** "My courses" (P04-T01): every owned course with its real status and counts. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "InstructorDashboard" });
  return { title: t("coursesTitle") };
}

export default async function InstructorCoursesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentSession();
  if (user === null) return null;

  const instructorId = await getInstructorProfileId(user.id);
  const t = await getTranslations({ locale, namespace: "InstructorDashboard" });
  const localeValue = locale === "en" ? "en" : "ar";

  if (instructorId === null) {
    return <NoInstructorProfile />;
  }

  const courses = await listInstructorCourses(instructorId);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-semibold text-foreground">
            {t("coursesTitle")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("coursesSubtitle")}</p>
        </div>
        <CreateCourseButton />
      </div>

      {courses.length === 0 ? (
        <div className="mt-6 rounded-md border border-border bg-surface p-8 text-center">
          <h3 className="font-heading text-lg font-semibold text-foreground">{t("emptyTitle")}</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{t("emptyBody")}</p>
          <div className="mt-4 flex justify-center">
            <CreateCourseButton />
          </div>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-border rounded-md border border-border bg-surface">
          {courses.map((course) => {
            const title =
              localeValue === "en"
                ? (course.titleEn ?? course.titleAr)
                : (course.titleAr ?? course.titleEn);
            const canPreview = course.status === "PUBLISHED" || course.status === "UNLISTED";

            return (
              <li key={course.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground">
                        {title === null || title === "" ? t("untitled") : title}
                      </p>
                      <CourseStatusBadge status={course.status} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {`${t("tableLessons")}: ${course.lessonCount} · ${t("tableStudents")}: ${course.studentsCount} · ${t("tableUpdated")}: ${formatDate(course.updatedAt, localeValue)}`}
                    </p>
                    {course.status === "REJECTED" && course.rejectionReason !== null && (
                      <p className="mt-1 text-sm text-danger">
                        {t("rejectionNote", { reason: course.rejectionReason })}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <Link
                      href={`/instructor/courses/${course.id}/edit`}
                      className="font-medium text-primary hover:underline"
                    >
                      {t("edit")}
                    </Link>
                    {canPreview && (
                      <Link
                        href={`/courses/${course.slug}`}
                        className="text-muted-foreground hover:text-foreground hover:underline"
                      >
                        {t("preview")}
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
