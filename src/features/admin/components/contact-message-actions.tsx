"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { setContactStatusAction } from "@/features/admin/contact-actions";
import { useRouter } from "@/i18n/navigation";

/** Inline contact message status actions. */
export function ContactMessageActions({
  messageId,
  status,
}: {
  messageId: string;
  status: "NEW" | "READ" | "ARCHIVED";
}) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function setStatus(next: "READ" | "ARCHIVED") {
    setBusy(next);
    setError(null);
    const result = await setContactStatusAction({ messageId, status: next });
    setBusy(null);
    if (result.ok) router.refresh();
    else setError(t("contactError"));
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap justify-end gap-1">
        {status !== "READ" && (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            loading={busy === "READ"}
            disabled={busy !== null}
            onClick={() => {
              void setStatus("READ");
            }}
          >
            {t("contactMarkRead")}
          </Button>
        )}
        {status !== "ARCHIVED" && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            loading={busy === "ARCHIVED"}
            disabled={busy !== null}
            onClick={() => {
              void setStatus("ARCHIVED");
            }}
          >
            {t("contactArchive")}
          </Button>
        )}
      </div>
      {error !== null && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
