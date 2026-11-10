import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { CourseStatusBadge } from "@/features/instructor-builder/components/course-status-badge";
import { NoInstructorProfile } from "@/features/instructor-builder/components/no-instructor-profile";
import { WizardNav } from "@/features/instructor-builder/components/wizard-nav";
import { Link } from "@/i18n/navigation";
import { findOwnedCourse, getInstructorProfileId } from "@/server/instructor-courses";
import { getCurrentSession } from "@/server/session";

/**
 * Per-course builder shell (P04-T02).
 *
 * Ownership is enforced here as well as in every action: another instructor's course id renders
 * 404, and the status banner makes it clear whether the course is a draft, under review or public.
 */
export default async function CourseBuilderLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const user = await getCurrentSession();
  if (user === null) return null;

  const instructorId = await getInstructorProfileId(user.id);
  if (instructorId === null) return <NoInstructorProfile />;

  const course = await findOwnedCourse(instructorId, id);
  if (course === null) notFound();

  const [t, dashboardT] = await Promise.all([
    getTranslations({ locale, namespace: "CourseBuilder" }),
    getTranslations({ locale, namespace: "InstructorDashboard" }),
  ]);
  const title =
    locale === "en" ? (course.titleEn ?? course.titleAr) : (course.titleAr ?? course.titleEn);

  return (
    <div>
      <Link href="/instructor/courses" className="text-sm font-medium text-primary hover:underline">
        {t("backToCourses")}
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h2 className="font-heading text-2xl font-semibold text-foreground">
          {title === null || title === "" ? t("untitled") : title}
        </h2>
        <CourseStatusBadge status={course.status} />
      </div>

      {course.status === "REJECTED" && course.rejectionReason !== null && (
        <p className="mt-3 rounded-sm border border-danger px-3 py-2 text-sm text-danger">
          {dashboardT("rejectionNote", { reason: course.rejectionReason })}
        </p>
      )}

      <div className="mt-5">
        <WizardNav courseId={course.id} />
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}
