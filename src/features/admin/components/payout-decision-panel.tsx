"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  approvePayoutAction,
  markPayoutPaidAction,
  rejectPayoutAction,
} from "@/features/admin/payouts-actions";
import { useRouter } from "@/i18n/navigation";

/** Admin payout decision (P10-T04, BR-13). Marking paid appends the negative ledger entry. */
export function PayoutDecisionPanel({
  payoutId,
  status,
}: {
  payoutId: string;
  status: "REQUESTED" | "APPROVED" | "PAID" | "REJECTED";
}) {
  const t = useTranslations("AdminPayoutDetail");
  const router = useRouter();
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<"approve" | "paid" | "reject" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const open = status === "REQUESTED" || status === "APPROVED";

  async function run(kind: "approve" | "paid" | "reject") {
    setBusy(kind);
    setError(null);
    setMessage(null);
    const result =
      kind === "approve"
        ? await approvePayoutAction({ payoutId })
        : kind === "paid"
          ? await markPayoutPaidAction({ payoutId, transferReference: reference })
          : await rejectPayoutAction({ payoutId, note });
    setBusy(null);
    if (result.ok) {
      setMessage(kind === "approve" ? t("approved") : kind === "paid" ? t("paid") : t("rejected"));
      router.refresh();
      return;
    }
    setError(
      result.error.message.includes("PAYOUT_ALREADY_DECIDED")
        ? t("alreadyDecided")
        : result.error.message.includes("TRANSFER_REFERENCE_REQUIRED")
          ? t("referenceRequired")
          : t("error"),
    );
  }

  if (!open) {
    return (
      <p className="rounded-md border border-border bg-surface p-5 text-sm text-muted-foreground">
        {t("alreadyDecided")}
      </p>
    );
  }

  return (
    <div className="rounded-md border border-border bg-surface p-5">
      <h3 className="font-heading text-lg font-semibold text-foreground">{t("decisionTitle")}</h3>

      <div className="mt-3 max-w-md space-y-1">
        <Label htmlFor="payout-reference">{t("referenceLabel")}</Label>
        <Input
          id="payout-reference"
          value={reference}
          onChange={(event) => setReference(event.target.value)}
          placeholder={t("referencePlaceholder")}
          dir="ltr"
        />
      </div>

      <div className="mt-3 max-w-md space-y-1">
        <Label htmlFor="payout-note">{t("note")}</Label>
        <Textarea
          id="payout-note"
          rows={3}
          maxLength={2000}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder={t("notePlaceholder")}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {status === "REQUESTED" && (
          <Button
            type="button"
            variant="secondary"
            loading={busy === "approve"}
            disabled={busy !== null}
            onClick={() => {
              void run("approve");
            }}
          >
            {t("approve")}
          </Button>
        )}
        <Button
          type="button"
          loading={busy === "paid"}
          disabled={busy !== null}
          onClick={() => {
            void run("paid");
          }}
        >
          {t("markPaid")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          loading={busy === "reject"}
          disabled={busy !== null}
          onClick={() => {
            void run("reject");
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
      {message !== null && (
        <p role="status" className="mt-2 text-sm text-success">
          {message}
        </p>
      )}
    </div>
  );
}
