import type { Metadata } from "next";
import { Check, X } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { CourseDetailView } from "@/components/catalog/course-detail-view";
import { Badge } from "@/components/ui/badge";
import type { Locale } from "@/config/site";
import { CourseStatusActions } from "@/features/admin/components/course-status-actions";
import { ReviewDecisionPanel } from "@/features/admin/components/review-decision-panel";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/dates";
import type { ChecklistKey } from "@/server/course-checklist";
import { getCourseChecklist } from "@/server/course-checklist";
import { getCourseReviewMeta } from "@/server/admin/courses";
import { getCourseDetailForReview, getSimilarCourses } from "@/server/catalog";

/** One course review (P05-T02): content, BR-02 checklist, history, decision and learner view. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Admin" });
  return { title: t("review") };
}

export default async function AdminCourseReviewPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const course = await getCourseDetailForReview(id);
  if (course === null) notFound();

  const meta = await getCourseReviewMeta(id);
  if (meta === null) notFound();

  const [checklist, similar, t, publishT] = await Promise.all([
    getCourseChecklist(meta.instructorProfileId, id),
    getSimilarCourses(id, course.category.slug, 3),
    getTranslations({ locale, namespace: "Admin" }),
    getTranslations({ locale, namespace: "Publish" }),
  ]);
  const localeValue: Locale = locale === "en" ? "en" : "ar";
  const title =
    localeValue === "en"
      ? (course.titleEn ?? course.titleAr ?? course.slug)
      : (course.titleAr ?? course.titleEn ?? course.slug);

  const itemLabels: Record<ChecklistKey, string> = {
    basics: publishT("itemBasics"),
    cover: publishT("itemCover"),
    objectives: publishT("itemObjectives"),
    sections: publishT("itemSections"),
    lessons: publishT("itemLessons"),
    price: publishT("itemPrice"),
  };

  const statusLabel =
    course.status === "PENDING_REVIEW"
      ? t("coursePending")
      : course.status === "PUBLISHED"
        ? t("coursePublished")
        : course.status === "REJECTED"
          ? t("courseRejected")
          : course.status === "UNLISTED"
            ? t("courseUnlisted")
            : course.status === "ARCHIVED"
              ? t("courseArchived")
              : t("courseDraft");

  return (
    <div>
      <Link href="/admin/courses" className="text-sm font-medium text-primary hover:underline">
        {t("reviewBack")}
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h2 className="font-heading text-2xl font-semibold text-foreground">{title}</h2>
        <Badge
          variant={
            course.status === "PUBLISHED"
              ? "success"
              : course.status === "PENDING_REVIEW"
                ? "warning"
                : course.status === "REJECTED"
                  ? "danger"
                  : "neutral"
          }
        >
          {statusLabel}
        </Badge>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("reviewSubmittedBy", {
          name: `${meta.instructorName} (${meta.instructorEmail})`,
          date: formatDate(course.updatedAt, localeValue),
        })}
      </p>

      <div className="mt-6 space-y-6">
        {course.status === "PENDING_REVIEW" ? (
          <ReviewDecisionPanel
            courseId={course.id}
            items={checklist.items.map((item) => ({
              key: item.key,
              label: itemLabels[item.key],
            }))}
          />
        ) : course.status === "PUBLISHED" || course.status === "UNLISTED" ? (
          <CourseStatusActions courseId={course.id} status={course.status} />
        ) : (
          <p className="rounded-md border border-border bg-surface p-4 text-sm text-muted-foreground">
            {t("noDecisionAvailable")}
          </p>
        )}

        {course.status === "REJECTED" && meta.rejectionReason !== null && (
          <section
            aria-labelledby="rejection-reason-title"
            className="rounded-md border border-danger bg-surface p-5"
          >
            <h3
              id="rejection-reason-title"
              className="font-heading text-lg font-semibold text-foreground"
            >
              {t("rejectionReason")}
            </h3>
            <p className="mt-2 text-sm whitespace-pre-line text-foreground">
              {meta.rejectionReason}
            </p>
          </section>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <section
            aria-labelledby="checklist-title"
            className="rounded-md border border-border bg-surface p-5"
          >
            <h3 id="checklist-title" className="font-heading text-lg font-semibold text-foreground">
              {t("reviewChecklistTitle")}
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              {checklist.items.map((item) => (
                <li key={item.key} className="flex items-start gap-2">
                  {item.passed ? (
                    <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                  ) : (
                    <X className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
                  )}
                  <span className="flex-1 text-foreground">{itemLabels[item.key]}</span>
                  <span
                    className={
                      item.passed
                        ? "text-xs font-medium text-success"
                        : "text-xs font-medium text-danger"
                    }
                  >
                    {item.passed ? publishT("passed") : publishT("failed")}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section
            aria-labelledby="notes-title"
            className="rounded-md border border-border bg-surface p-5"
          >
            <h3 id="notes-title" className="font-heading text-lg font-semibold text-foreground">
              {t("reviewNotesTitle")}
            </h3>
            {meta.notes.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">{t("reviewNoNotes")}</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {meta.notes.map((note) => (
                  <li key={note.id} className="rounded-sm border border-border bg-muted p-3">
                    <p className="text-sm text-foreground">{note.note}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {`${note.adminName} · ${formatDate(note.createdAt, localeValue)}`}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section aria-labelledby="learner-view-title">
          <h3
            id="learner-view-title"
            className="font-heading text-lg font-semibold text-foreground"
          >
            {t("learnerViewTitle")}
          </h3>
          <div className="mt-4">
            <CourseDetailView
              course={course}
              similar={similar}
              locale={localeValue}
              isAuthenticated
              wishlisted={false}
              preview
              headingLevel={2}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
