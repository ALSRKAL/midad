"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { decideReportAction } from "@/features/admin/reports-actions";
import { useRouter } from "@/i18n/navigation";

/** Inline report actions inside the admin table. */
export function ReportActions({ reportId }: { reportId: string }) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(decision: "RESOLVED" | "DISMISSED", hide: boolean) {
    setBusy(hide ? "hide" : decision);
    setError(null);
    const result = await decideReportAction({ reportId, decision, hide });
    setBusy(null);
    if (result.ok) {
      router.refresh();
      return;
    }
    setError(
      result.error.message.includes("REPORT_ALREADY_DECIDED")
        ? t("reportAlreadyDecided")
        : t("reportError"),
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap justify-end gap-1">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          loading={busy === "hide"}
          disabled={busy !== null}
          onClick={() => {
            void decide("RESOLVED", true);
          }}
        >
          {t("reportHideResolve")}
        </Button>
        <Button
          type="button"
          size="sm"
          loading={busy === "RESOLVED"}
          disabled={busy !== null}
          onClick={() => {
            void decide("RESOLVED", false);
          }}
        >
          {t("reportResolve")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          loading={busy === "DISMISSED"}
          disabled={busy !== null}
          onClick={() => {
            void decide("DISMISSED", false);
          }}
        >
          {t("reportDismiss")}
        </Button>
      </div>
      {error !== null && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
