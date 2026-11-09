"use client";

import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { setLessonCompletedAction } from "@/features/player/actions";
import { useRouter } from "@/i18n/navigation";

/** Manual completion for text/file lessons; video lessons complete from watched segments. */
export function LessonCompleteButton({
  lessonId,
  completed,
  type,
}: {
  lessonId: string;
  completed: boolean;
  type: "VIDEO" | "TEXT" | "FILE" | "QUIZ";
}) {
  const t = useTranslations("Player");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (type === "QUIZ") return null;

  if (completed) {
    return (
      <p className="mt-4 flex items-center gap-2 text-sm font-medium text-success">
        <CheckCircle2 className="size-4" aria-hidden="true" />
        {t("completed")}
        {type !== "VIDEO" && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            loading={pending}
            onClick={() => {
              setPending(true);
              void setLessonCompletedAction({ lessonId, completed: false }).then((result) => {
                setPending(false);
                if (result.ok) router.refresh();
                else setError(t("saveError"));
              });
            }}
          >
            {t("markIncomplete")}
          </Button>
        )}
      </p>
    );
  }

  return (
    <div className="mt-4">
      <Button
        type="button"
        variant="secondary"
        loading={pending}
        onClick={() => {
          setPending(true);
          void setLessonCompletedAction({ lessonId, completed: true }).then((result) => {
            setPending(false);
            if (result.ok) router.refresh();
            else setError(t("saveError"));
          });
        }}
      >
        {t("markComplete")}
      </Button>
      {error !== null && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
