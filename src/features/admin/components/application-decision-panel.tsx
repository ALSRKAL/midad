"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { approveApplicationAction, rejectApplicationAction } from "@/features/admin/actions";
import { useRouter } from "@/i18n/navigation";

/** Approve/reject an instructor application (P05-T03). Promotion happens server-side. */
export function ApplicationDecisionPanel({ applicationId }: { applicationId: string }) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [pending, setPending] = useState<"approve" | "reject" | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function approve() {
    setPending("approve");
    setError(null);
    const result = await approveApplicationAction({ applicationId });
    setPending(null);
    if (!result.ok) {
      setError(t("applicationDecisionFailed"));
      return;
    }
    router.refresh();
  }

  async function reject() {
    if (reason.trim().length < 10) {
      setError(t("applicationReasonTooShort"));
      return;
    }
    setPending("reject");
    setError(null);
    const result = await rejectApplicationAction({ applicationId, reason });
    setPending(null);
    if (!result.ok) {
      setError(
        result.error.message.includes("REASON_TOO_SHORT")
          ? t("applicationReasonTooShort")
          : t("applicationDecisionFailed"),
      );
      return;
    }
    router.refresh();
  }

  return (
    <section
      aria-labelledby="application-decision-title"
      className="rounded-md border border-border bg-surface p-5"
    >
      <h3
        id="application-decision-title"
        className="font-heading text-lg font-semibold text-foreground"
      >
        {t("applicationDecisionTitle")}
      </h3>

      {error !== null && (
        <p
          role="alert"
          className="mt-3 rounded-sm border border-danger px-3 py-2 text-sm text-danger"
        >
          {error}
        </p>
      )}

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void approve();
          }}
          className="rounded-sm border border-success p-4"
        >
          <h4 className="font-medium text-foreground">{t("approveApplication")}</h4>
          <p className="mt-2 text-sm text-muted-foreground">{t("applicationApprovedNote")}</p>
          <Button type="submit" className="mt-3" loading={pending === "approve"}>
            {pending === "approve" ? t("approvingApplication") : t("approveApplication")}
          </Button>
        </form>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void reject();
          }}
          className="rounded-sm border border-danger p-4"
        >
          <h4 className="font-medium text-foreground">{t("rejectApplication")}</h4>
          <div className="mt-2 space-y-1">
            <Label htmlFor="application-reason">{t("applicationReasonLabel")}</Label>
            <Textarea
              id="application-reason"
              rows={3}
              required
              minLength={10}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">{t("applicationReasonHint")}</p>
          </div>
          <Button type="submit" variant="danger" className="mt-3" loading={pending === "reject"}>
            {pending === "reject" ? t("rejectingApplication") : t("rejectApplication")}
          </Button>
        </form>
      </div>
    </section>
  );
}
