import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { CourseBasicsForm } from "@/features/instructor-builder/components/course-basics-form";
import { CourseCoverUploader } from "@/features/instructor-builder/components/course-cover-uploader";
import { ObjectivesEditor } from "@/features/instructor-builder/components/objectives-editor";
import {
  findOwnedCourse,
  getCourseObjectives,
  getInstructorProfileId,
} from "@/server/instructor-courses";
import { getCurrentSession } from "@/server/session";
import { publicAssetUrl } from "@/server/storage";
import { listCatalogCategories } from "@/server/catalog";

/** Basics step (P04-T02): bilingual content, classification and the cover. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "CourseBuilder" });
  return { title: t("basicsTitle") };
}

export default async function CourseBasicsPage({
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

  const [course, categories, t] = await Promise.all([
    findOwnedCourse(instructorId, id),
    listCatalogCategories(),
    getTranslations({ locale, namespace: "CourseBuilder" }),
  ]);
  if (course === null) notFound();

  const objectives = await getCourseObjectives(instructorId, id);

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-labelledby="basics-title">
          <h3 id="basics-title" className="font-heading text-lg font-semibold text-foreground">
            {t("basicsTitle")}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{t("basicsSubtitle")}</p>
          <div className="mt-5">
            <CourseBasicsForm
              courseId={course.id}
              initial={{
                titleAr: course.titleAr ?? "",
                titleEn: course.titleEn ?? "",
                subtitleAr: course.subtitleAr ?? "",
                subtitleEn: course.subtitleEn ?? "",
                descriptionAr: course.descriptionAr ?? "",
                descriptionEn: course.descriptionEn ?? "",
                categoryId: course.categoryId,
                level: course.level,
                language: course.language,
              }}
              categories={categories.map((category) => ({
                id: category.id,
                nameAr: category.nameAr,
                nameEn: category.nameEn,
              }))}
            />
          </div>
        </section>

        <aside className="h-fit rounded-md border border-border bg-surface p-5">
          <h3 className="font-heading text-lg font-semibold text-foreground">{t("coverTitle")}</h3>
          <div className="mt-4">
            <CourseCoverUploader
              courseId={course.id}
              initialUrl={
                course.coverImageKey === null ? null : publicAssetUrl(course.coverImageKey)
              }
            />
          </div>
        </aside>
      </div>

      <section className="rounded-md border border-border bg-surface p-5">
        <ObjectivesEditor
          courseId={course.id}
          initial={objectives.map((objective) => ({
            textAr: objective.textAr,
            textEn: objective.textEn,
          }))}
        />
      </section>
    </div>
  );
}
