"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { approveCourseAction, rejectCourseAction } from "@/features/admin/actions";
import { useRouter } from "@/i18n/navigation";

/**
 * Approve/reject panel (P05-T02, BR-01/BR-02).
 *
 * Approval may carry a note; rejection requires a reason and allows one note per checklist item.
 * The actions re-validate the transition and recompute nothing from the client, and a refresh swaps
 * the panel for the new status.
 */
export function ReviewDecisionPanel({
  courseId,
  items,
}: {
  courseId: string;
  items: Array<{ key: string; label: string }>;
}) {
  const t = useTranslations("Admin");
  const router = useRouter();

  const [approveNote, setApproveNote] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function approve() {
    setPending("approve");
    setError(null);
    const result = await approveCourseAction({ courseId, note: approveNote });
    setPending(null);

    if (!result.ok) {
      setError(t("decisionFailed"));
      return;
    }
    router.refresh();
  }

  async function reject() {
    if (reason.trim().length < 10) {
      setError(t("reasonTooShort"));
      return;
    }

    setPending("reject");
    setError(null);
    const result = await rejectCourseAction({
      courseId,
      reason,
      notes: items
        .map((item) => ({ label: item.label, note: notes[item.key] ?? "" }))
        .filter((item) => item.note.trim() !== ""),
    });
    setPending(null);

    if (!result.ok) {
      setError(
        result.error.message.includes("REASON_TOO_SHORT")
          ? t("reasonTooShort")
          : t("decisionFailed"),
      );
      return;
    }
    router.refresh();
  }

  return (
    <section
      aria-labelledby="decision-title"
      className="rounded-md border border-border bg-surface p-5"
    >
      <h3 id="decision-title" className="font-heading text-lg font-semibold text-foreground">
        {t("decisionTitle")}
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
          className="space-y-3 rounded-sm border border-success p-4"
        >
          <h4 className="font-medium text-foreground">{t("approveTitle")}</h4>
          <div className="space-y-1">
            <Label htmlFor="approve-note">{t("approveNoteLabel")}</Label>
            <Textarea
              id="approve-note"
              rows={2}
              value={approveNote}
              onChange={(event) => setApproveNote(event.target.value)}
            />
          </div>
          <Button type="submit" loading={pending === "approve"}>
            {pending === "approve" ? t("approving") : t("approve")}
          </Button>
        </form>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void reject();
          }}
          className="space-y-3 rounded-sm border border-danger p-4"
        >
          <h4 className="font-medium text-foreground">{t("rejectTitle")}</h4>
          <div className="space-y-1">
            <Label htmlFor="reject-reason">{t("rejectReasonLabel")}</Label>
            <Textarea
              id="reject-reason"
              rows={3}
              required
              minLength={10}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">{t("rejectReasonHint")}</p>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-foreground">
              {t("reviewChecklistTitle")}
            </legend>
            {items.map((item) => (
              <div key={item.key} className="space-y-1">
                <Label htmlFor={`reject-note-${item.key}`}>
                  {t("rejectNoteLabel", { item: item.label })}
                </Label>
                <Input
                  id={`reject-note-${item.key}`}
                  value={notes[item.key] ?? ""}
                  maxLength={1000}
                  onChange={(event) =>
                    setNotes((current) => ({ ...current, [item.key]: event.target.value }))
                  }
                />
              </div>
            ))}
          </fieldset>

          <Button type="submit" variant="danger" loading={pending === "reject"}>
            {pending === "reject" ? t("rejecting") : t("reject")}
          </Button>
        </form>
      </div>
    </section>
  );
}
