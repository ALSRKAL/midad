"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  archiveCourseAction,
  relistCourseAction,
  unlistCourseAction,
} from "@/features/admin/actions";
import { useRouter } from "@/i18n/navigation";

/** Publishing controls for a published/unlisted course (BR-01). */
export function CourseStatusActions({
  courseId,
  status,
}: {
  courseId: string;
  status: "PUBLISHED" | "UNLISTED" | "ARCHIVED" | "DRAFT" | "PENDING_REVIEW" | "REJECTED";
}) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  if (status !== "PUBLISHED" && status !== "UNLISTED") return null;

  async function run(action: "unlist" | "relist" | "archive"): Promise<boolean> {
    setError(null);
    const result =
      action === "unlist"
        ? await unlistCourseAction({ courseId })
        : action === "relist"
          ? await relistCourseAction({ courseId })
          : await archiveCourseAction({ courseId });

    if (!result.ok) {
      setError(t("statusActionFailed"));
      return false;
    }
    router.refresh();
    return true;
  }

  return (
    <section
      aria-labelledby="status-actions-title"
      className="rounded-md border border-border bg-surface p-5"
    >
      <h3 id="status-actions-title" className="font-heading text-lg font-semibold text-foreground">
        {t("statusActionsTitle")}
      </h3>

      {error !== null && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {status === "PUBLISHED" ? (
          <ConfirmDialog
            triggerLabel={t("unlist")}
            title={t("unlistTitle")}
            description={t("unlistBody")}
            confirmLabel={t("unlistConfirm")}
            cancelLabel={t("cancel")}
            errorLabel={t("statusActionFailed")}
            onConfirm={() => run("unlist")}
          />
        ) : (
          <ConfirmDialog
            triggerLabel={t("relist")}
            title={t("relistTitle")}
            description={t("relistBody")}
            confirmLabel={t("relistConfirm")}
            cancelLabel={t("cancel")}
            errorLabel={t("statusActionFailed")}
            onConfirm={() => run("relist")}
          />
        )}

        <ConfirmDialog
          triggerLabel={t("archive")}
          title={t("archiveTitle")}
          description={t("archiveBody")}
          confirmLabel={t("archiveConfirm")}
          cancelLabel={t("cancel")}
          errorLabel={t("statusActionFailed")}
          onConfirm={() => run("archive")}
        />
      </div>
    </section>
  );
}
