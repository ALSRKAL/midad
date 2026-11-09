"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { approveRefundAction, rejectRefundAction } from "@/features/admin/refunds-actions";
import { useRouter } from "@/i18n/navigation";

/** Admin refund decision (P10-T03). Approval executes Stripe; rejection records the reason. */
export function RefundDecisionPanel({ refundId, note }: { refundId: string; note: string | null }) {
  const t = useTranslations("AdminRefundDetail");
  const router = useRouter();
  const [decisionNote, setDecisionNote] = useState(note ?? "");
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function approve() {
    setApproving(true);
    setError(null);
    const result = await approveRefundAction({ refundId, note: decisionNote });
    setApproving(false);
    if (result.ok) {
      setStatus(t("approved"));
      router.refresh();
      return;
    }
    const code = result.error.message;
    setError(
      code.includes("PAYMENT_INTENT_MISSING")
        ? t("paymentMissing")
        : code.includes("REFUND_NOT_SUCCEEDED")
          ? t("notSucceeded")
          : code.includes("REFUND_ALREADY_DECIDED")
            ? t("alreadyDecided")
            : t("error"),
    );
  }

  async function reject() {
    setRejecting(true);
    setError(null);
    const result = await rejectRefundAction({ refundId, note: decisionNote });
    setRejecting(false);
    if (result.ok) {
      setStatus(t("rejected"));
      router.refresh();
      return;
    }
    setError(
      result.error.message.includes("REFUND_ALREADY_DECIDED") ? t("alreadyDecided") : t("error"),
    );
  }

  return (
    <div className="rounded-md border border-border bg-surface p-5">
      <h3 className="font-heading text-lg font-semibold text-foreground">{t("decisionTitle")}</h3>
      <div className="mt-3 space-y-1">
        <Label htmlFor="refund-decision-note">{t("note")}</Label>
        <Textarea
          id="refund-decision-note"
          rows={3}
          maxLength={2000}
          value={decisionNote}
          onChange={(event) => setDecisionNote(event.target.value)}
          placeholder={t("notePlaceholder")}
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          loading={approving}
          disabled={rejecting}
          onClick={() => {
            void approve();
          }}
        >
          {t("approve")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          loading={rejecting}
          disabled={approving}
          onClick={() => {
            void reject();
          }}
        >
          {t("reject")}
        </Button>
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
    </div>
  );
}
