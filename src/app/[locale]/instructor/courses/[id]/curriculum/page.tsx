import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { CurriculumEditor } from "@/features/instructor-builder/components/curriculum-editor";
import { getCurriculum } from "@/server/curriculum";
import { findOwnedCourse, getInstructorProfileId } from "@/server/instructor-courses";
import { getCurrentSession } from "@/server/session";

/** Curriculum step (P04-T03). */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Curriculum" });
  return { title: t("title") };
}

export default async function CurriculumPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const user = await getCurrentSession();
  if (user === null) return null;

  const instructorId = await getInstructorProfileId(user.id);
  if (instructorId === null) notFound();

  const course = await findOwnedCourse(instructorId, id);
  if (course === null) notFound();

  const [sections, t] = await Promise.all([
    getCurriculum(instructorId, id),
    getTranslations({ locale, namespace: "Curriculum" }),
  ]);

  return (
    <section aria-labelledby="curriculum-title">
      <h3 id="curriculum-title" className="font-heading text-lg font-semibold text-foreground">
        {t("title")}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      <div className="mt-5">
        <CurriculumEditor courseId={course.id} initialSections={sections} />
      </div>
    </section>
  );
}
