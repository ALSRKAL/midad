"use client";

import { Flag } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { reportReviewAction } from "@/features/reviews/actions";

/** Report a review (P09-T01). A duplicate open report is refused by the server. */
export function ReportReviewButton({ reviewId }: { reviewId: string }) {
  const t = useTranslations("Reviews");
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
          <Flag className="size-4" aria-hidden="true" />
          {t("report")}
        </Button>
        {status !== null && (
          <p role="status" className="text-xs text-success">
            {status}
          </p>
        )}
      </div>
    );
  }

  return (
    <form
      className="mt-2 space-y-2 rounded-sm border border-border p-3"
      onSubmit={(event) => {
        event.preventDefault();
        setPending(true);
        setError(null);
        void reportReviewAction({ reviewId, reason, details }).then((result) => {
          setPending(false);
          if (result.ok) {
            setStatus(t("reported"));
            setOpen(false);
          } else {
            setError(
              result.error.message.includes("ALREADY_REPORTED")
                ? t("alreadyReported")
                : t("reportError"),
            );
          }
        });
      }}
    >
      <div className="space-y-1">
        <Label htmlFor={`report-${reviewId}`}>{t("reportReason")}</Label>
        <Input
          id={`report-${reviewId}`}
          required
          minLength={3}
          maxLength={200}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`report-details-${reviewId}`}>{t("reportDetails")}</Label>
        <Input
          id={`report-details-${reviewId}`}
          maxLength={2000}
          value={details}
          onChange={(event) => setDetails(event.target.value)}
        />
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" loading={pending}>
          {t("reportSubmit")}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          {t("cancel")}
        </Button>
      </div>
      {error !== null && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
      {status !== null && <p className="text-xs text-success">{status}</p>}
    </form>
  );
}
