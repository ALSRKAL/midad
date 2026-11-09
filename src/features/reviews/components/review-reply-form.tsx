"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { replyToReviewAction } from "@/features/reviews/actions";
import { useRouter } from "@/i18n/navigation";

/** Instructor reply to a review (P09-T01). Server checks course ownership. */
export function ReviewReplyForm({
  reviewId,
  initialReply,
}: {
  reviewId: string;
  initialReply: string | null;
}) {
  const t = useTranslations("Reviews");
  const router = useRouter();
  const [body, setBody] = useState(initialReply ?? "");
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="mt-3 rounded-sm border border-border p-3"
      onSubmit={(event) => {
        event.preventDefault();
        setPending(true);
        setError(null);
        void replyToReviewAction({ reviewId, body }).then((result) => {
          setPending(false);
          if (result.ok) {
            setStatus(t("replySaved"));
            router.refresh();
          } else {
            setError(t("error"));
          }
        });
      }}
    >
      <Label htmlFor={`reply-${reviewId}`} className="text-sm">
        {t("instructorReply")}
      </Label>
      <Textarea
        id={`reply-${reviewId}`}
        rows={2}
        maxLength={2000}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder={t("replyPlaceholder")}
      />
      <div className="mt-2 flex items-center gap-2">
        <Button type="submit" size="sm" loading={pending}>
          {t("replySubmit")}
        </Button>
        {status !== null && <span className="text-xs text-success">{status}</span>}
        {error !== null && (
          <span role="alert" className="text-xs text-danger">
            {error}
          </span>
        )}
      </div>
    </form>
  );
}
