import { useTranslations } from "next-intl";

/**
 * Course status badge, shared by the dashboard and the course list.
 *
 * The label and the colour always come from the same switch, so a status cannot be shown in the
 * wrong colour after an enum change (the fallback is the draft style).
 */
export type CourseStatus =
  "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "REJECTED" | "UNLISTED" | "ARCHIVED";

export function CourseStatusBadge({ status }: { status: CourseStatus }) {
  const t = useTranslations("InstructorDashboard");

  const label =
    status === "PENDING_REVIEW"
      ? t("statusPending")
      : status === "PUBLISHED"
        ? t("statusPublished")
        : status === "REJECTED"
          ? t("statusRejected")
          : status === "UNLISTED"
            ? t("statusUnlisted")
            : status === "ARCHIVED"
              ? t("statusArchived")
              : t("statusDraft");

  const styles =
    status === "PUBLISHED"
      ? "border-success text-success"
      : status === "PENDING_REVIEW"
        ? "border-warning text-warning"
        : status === "REJECTED"
          ? "border-danger text-danger"
          : status === "UNLISTED" || status === "ARCHIVED"
            ? "border-border-strong text-muted-foreground"
            : "border-border-strong text-foreground";

  return (
    <span className={`inline-flex rounded-sm border px-2 py-0.5 text-xs ${styles}`}>{label}</span>
  );
}
