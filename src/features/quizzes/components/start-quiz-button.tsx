"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { startQuizAction } from "@/features/quizzes/actions";
import { useRouter } from "@/i18n/navigation";

/** Starts (or resumes) an attempt; the timer and attempt cap are enforced on the server. */
export function StartQuizButton({
  lessonId,
  courseSlug,
  canStart,
  hasInProgress,
}: {
  lessonId: string;
  courseSlug: string;
  canStart: boolean;
  hasInProgress: boolean;
}) {
  const t = useTranslations("Quiz");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setPending(true);
    setError(null);
    const result = await startQuizAction({ lessonId });
    setPending(false);
    if (!result.ok) {
      setError(result.error.message.includes("MAX_ATTEMPTS") ? t("maxReached") : t("error"));
      return;
    }
    router.push(`/learn/${courseSlug}/${lessonId}/quiz?attempt=${result.value.attemptId}`);
  }

  return (
    <div>
      <Button
        type="button"
        loading={pending}
        disabled={!canStart && !hasInProgress}
        onClick={() => {
          void start();
        }}
      >
        {pending
          ? t("starting")
          : hasInProgress
            ? t("resume")
            : canStart
              ? t("start")
              : t("maxReached")}
      </Button>
      {error !== null && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
