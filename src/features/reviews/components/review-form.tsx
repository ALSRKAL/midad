"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { deleteReviewAction, saveReviewAction } from "@/features/reviews/actions";
import { useRouter } from "@/i18n/navigation";

/** Review form (BR-18): only rendered when the server says the learner is eligible. */
export function ReviewForm({
  courseId,
  existing,
}: {
  courseId: string;
  existing: { id: string; rating: number; body: string | null } | null;
}) {
  const t = useTranslations("Reviews");
  const router = useRouter();
  const [rating, setRating] = useState(existing?.rating ?? 5);
  const [body, setBody] = useState(existing?.body ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function submit() {
    setPending(true);
    setError(null);
    const result = await saveReviewAction({ courseId, rating, body });
    setPending(false);
    if (!result.ok) {
      setError(t("error"));
      return;
    }
    setStatus(t("saved"));
    router.refresh();
  }

  async function remove() {
    if (existing === null) return;
    setPending(true);
    setError(null);
    const result = await deleteReviewAction({ reviewId: existing.id });
    setPending(false);
    if (!result.ok) {
      setError(t("error"));
      return;
    }
    setBody("");
    setStatus(t("deleted"));
    router.refresh();
  }

  return (
    <form
      className="mt-4 rounded-md border border-border bg-surface p-5"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <h3 className="font-heading text-lg font-semibold text-foreground">
        {existing === null ? t("writeTitle") : t("editTitle")}
      </h3>
      <fieldset className="mt-3">
        <legend className="text-sm text-muted-foreground">{t("rating")}</legend>
        <div className="mt-1 flex flex-row-reverse justify-end gap-1" dir="ltr">
          {[5, 4, 3, 2, 1].map((value) => (
            <label
              key={value}
              className="cursor-pointer rounded-sm text-2xl focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring"
            >
              <input
                type="radio"
                name={`rating-${courseId}`}
                value={value}
                checked={rating === value}
                onChange={() => setRating(value)}
                className="sr-only"
                aria-label={t("stars", { count: value })}
              />
              <span
                aria-hidden="true"
                className={value <= rating ? "text-accent-strong" : "text-muted-foreground"}
              >
                ★
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="mt-3 space-y-1">
        <Label htmlFor={`review-body-${courseId}`}>{t("body")}</Label>
        <Textarea
          id={`review-body-${courseId}`}
          rows={3}
          maxLength={2000}
          value={body}
          placeholder={t("bodyPlaceholder")}
          onChange={(event) => setBody(event.target.value)}
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button type="submit" loading={pending}>
          {pending ? t("saving") : existing === null ? t("submit") : t("update")}
        </Button>
        {existing !== null && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            loading={pending}
            onClick={() => {
              void remove();
            }}
          >
            {t("delete")}
          </Button>
        )}
      </div>
      {error !== null && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
      {status !== null && (
        <p role="status" className="mt-2 text-sm text-success">
          {status}
        </p>
      )}
    </form>
  );
}
