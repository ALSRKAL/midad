"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requestRefundAction } from "@/features/refunds/actions";
import { useRouter } from "@/i18n/navigation";

/** Student refund request (P10-T03, BR-10). Eligibility is rechecked on the server. */
export function RefundRequestForm({
  orderId,
  windowDays,
  maxProgressPct,
}: {
  orderId: string;
  windowDays: number;
  maxProgressPct: number;
}) {
  const t = useTranslations("Refunds");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(true)}>
          {t("request")}
        </Button>
        {status !== null && (
          <p role="status" className="text-sm text-success">
            {status}
          </p>
        )}
      </div>
    );
  }

  async function submit() {
    setPending(true);
    setError(null);
    const result = await requestRefundAction({ orderId, reason });
    setPending(false);
    if (result.ok) {
      setStatus(t("success"));
      setOpen(false);
      router.refresh();
      return;
    }
    const code = result.error.message;
    setError(
      code.includes("ALREADY_REQUESTED")
        ? t("alreadyRequested")
        : code.includes("WINDOW_EXPIRED")
          ? t("windowExpired", { days: windowDays })
          : code.includes("CERTIFICATE_ISSUED")
            ? t("certificateIssued")
            : code.includes("PROGRESS_TOO_HIGH")
              ? t("progressTooHigh", { pct: maxProgressPct })
              : code.includes("NOT_PAID")
                ? t("notPaid")
                : t("error"),
    );
  }

  return (
    <form
      className="mt-4 space-y-3 rounded-sm border border-border p-4"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <p className="text-sm text-muted-foreground">
        {t("hint", { days: windowDays, pct: maxProgressPct })}
      </p>
      <div className="space-y-1">
        <Label htmlFor={`refund-reason-${orderId}`}>{t("reason")}</Label>
        <Textarea
          id={`refund-reason-${orderId}`}
          rows={3}
          minLength={10}
          maxLength={2000}
          required
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder={t("reasonPlaceholder")}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" size="sm" loading={pending}>
          {pending ? t("submitting") : t("submit")}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          {t("cancel")}
        </Button>
      </div>
      {error !== null && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </form>
  );
}
