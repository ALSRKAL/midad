"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { submitCourseForReviewAction } from "@/features/instructor-builder/actions";
import { useRouter } from "@/i18n/navigation";

/** Submit for review (P04-T06). The server recomputes BR-02; the button is a hint, not a gate. */
export function SubmitForReviewButton({
  courseId,
  ready,
  canSubmit,
}: {
  courseId: string;
  ready: boolean;
  canSubmit: boolean;
}) {
  const t = useTranslations("Publish");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canSubmit) return null;

  async function submit() {
    setPending(true);
    setError(null);
    const result = await submitCourseForReviewAction({ courseId });
    setPending(false);

    if (!result.ok) {
      setError(
        result.error.message.includes("COURSE_NOT_READY")
          ? t("submitNotReady")
          : result.error.message.includes("COURSE_NOT_SUBMITTABLE")
            ? t("notSubmittable")
            : t("submitFailed"),
      );
      return;
    }

    setDone(true);
    router.refresh();
  }

  return (
    <div>
      {error !== null && (
        <p
          role="alert"
          className="mb-3 rounded-sm border border-danger px-3 py-2 text-sm text-danger"
        >
          {error}
        </p>
      )}
      {done && (
        <p
          role="status"
          className="mb-3 rounded-sm border border-success px-3 py-2 text-sm text-success"
        >
          {t("submitted")}
        </p>
      )}
      <Button
        type="button"
        loading={pending}
        disabled={!ready}
        onClick={() => {
          void submit();
        }}
      >
        {pending ? t("submitting") : t("submit")}
      </Button>
      {!ready && <p className="mt-2 text-sm text-muted-foreground">{t("submitNotReady")}</p>}
    </div>
  );
}
