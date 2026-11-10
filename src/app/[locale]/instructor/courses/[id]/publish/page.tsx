import type { Metadata } from "next";
import { Check, X } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { PricingForm } from "@/features/instructor-builder/components/pricing-form";
import { SubmitForReviewButton } from "@/features/instructor-builder/components/submit-for-review-button";
import { Link } from "@/i18n/navigation";
import { canSubmitForReview } from "@/lib/course-state";
import { getCourseChecklist, type ChecklistKey } from "@/server/course-checklist";
import { findOwnedCourse, getInstructorProfileId } from "@/server/instructor-courses";
import { getCurrentSession } from "@/server/session";

/** Pricing, BR-02 checklist and submission (P04-T06). */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Publish" });
  return { title: t("title") };
}

export default async function PublishPage({
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

  const [course, checklist, t, dashboardT] = await Promise.all([
    findOwnedCourse(instructorId, id),
    getCourseChecklist(instructorId, id),
    getTranslations({ locale, namespace: "Publish" }),
    getTranslations({ locale, namespace: "InstructorDashboard" }),
  ]);
  if (course === null) notFound();

  const itemLabels: Record<ChecklistKey, string> = {
    basics: t("itemBasics"),
    cover: t("itemCover"),
    objectives: t("itemObjectives"),
    sections: t("itemSections"),
    lessons: t("itemLessons"),
    price: t("itemPrice"),
  };
  const fixHref = (key: ChecklistKey): string | null => {
    if (key === "basics" || key === "cover" || key === "objectives") {
      return `/instructor/courses/${course.id}/edit`;
    }
    if (key === "sections" || key === "lessons") {
      return `/instructor/courses/${course.id}/curriculum`;
    }
    return null;
  };

  const canSubmit = canSubmitForReview(course.status);

  return (
    <div className="space-y-6">
      <header>
        <h3 className="font-heading text-lg font-semibold text-foreground">{t("title")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      {course.status === "PENDING_REVIEW" && (
        <p className="rounded-md border border-warning bg-surface p-4 text-sm text-foreground">
          {t("underReviewBody")}
        </p>
      )}
      {course.status === "PUBLISHED" && (
        <p className="rounded-md border border-success bg-surface p-4 text-sm text-foreground">
          {t("publishedBody")}
        </p>
      )}
      {course.status === "REJECTED" && (
        <div className="rounded-md border border-danger bg-surface p-4 text-sm text-foreground">
          <p>{t("rejectedBody")}</p>
          {course.rejectionReason !== null && (
            <p className="mt-2 text-danger">
              {dashboardT("rejectionNote", { reason: course.rejectionReason })}
            </p>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section
          aria-labelledby="pricing-title"
          className="rounded-md border border-border bg-surface p-5"
        >
          <h4 id="pricing-title" className="font-heading text-lg font-semibold text-foreground">
            {t("pricingTitle")}
          </h4>
          <p className="mt-1 text-sm text-muted-foreground">{t("pricingSubtitle")}</p>
          <div className="mt-4">
            <PricingForm
              courseId={course.id}
              initialIsFree={course.isFree}
              initialPriceCents={course.priceCents}
            />
          </div>
        </section>

        <section
          aria-labelledby="checklist-title"
          className="rounded-md border border-border bg-surface p-5"
        >
          <h4 id="checklist-title" className="font-heading text-lg font-semibold text-foreground">
            {t("checklistTitle")}
          </h4>
          <p className="mt-1 text-sm text-muted-foreground">{t("checklistSubtitle")}</p>

          <ul className="mt-4 space-y-2 text-sm">
            {checklist.items.map((item) => {
              const href = fixHref(item.key);
              return (
                <li key={item.key} className="flex flex-wrap items-start gap-2">
                  {item.passed ? (
                    <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                  ) : (
                    <X className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
                  )}
                  <span className="min-w-0 flex-1 text-foreground">
                    {itemLabels[item.key]}
                    {!item.passed && item.incompleteLessons > 0
                      ? ` — ${t("incompleteLessons", { count: item.incompleteLessons })}`
                      : ""}
                  </span>
                  <span
                    className={
                      item.passed
                        ? "text-xs font-medium text-success"
                        : "text-xs font-medium text-danger"
                    }
                  >
                    {item.passed ? t("passed") : t("failed")}
                  </span>
                  {!item.passed && href !== null && (
                    <Link href={href} className="text-xs font-medium text-primary hover:underline">
                      {t("goFix")}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <section
        aria-labelledby="submit-title"
        className="rounded-md border border-border bg-surface p-5"
      >
        <h4 id="submit-title" className="font-heading text-lg font-semibold text-foreground">
          {t("submitTitle")}
        </h4>
        <p className="mt-1 text-sm text-muted-foreground">{t("submitBody")}</p>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <SubmitForReviewButton
            courseId={course.id}
            ready={checklist.ready}
            canSubmit={canSubmit}
          />
          <Link
            href={`/preview/${course.id}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            {t("previewLink")}
          </Link>
        </div>
      </section>
    </div>
  );
}
