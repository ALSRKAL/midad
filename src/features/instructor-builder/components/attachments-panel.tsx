"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  deleteAttachmentAction,
  uploadAttachmentAction,
} from "@/features/instructor-builder/lesson-content-actions";

/**
 * Lesson attachments (P04-T05).
 *
 * Files are private; the download link goes through an authenticated route that checks course
 * ownership and then redirects to a short-lived signed URL.
 */
const ACCEPTED = ["application/pdf", "image/png", "image/jpeg", "application/zip"] as const;
const MAX_BYTES = 20 * 1024 * 1024;

export type AttachmentItem = {
  id: string;
  title: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentsPanel({
  courseId,
  lessonId,
  initial,
}: {
  courseId: string;
  lessonId: string;
  initial: AttachmentItem[];
}) {
  const t = useTranslations("LessonContent");
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState(initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setError(null);
    if (!ACCEPTED.includes(file.type as (typeof ACCEPTED)[number])) {
      setError(t("attachmentTypeInvalid"));
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(t("attachmentTooLarge"));
      return;
    }

    setPending(true);
    const formData = new FormData();
    formData.append("courseId", courseId);
    formData.append("lessonId", lessonId);
    formData.append("file", file);
    const result = await uploadAttachmentAction(formData);
    setPending(false);

    if (!result.ok) {
      setError(t("attachmentFailed"));
      return;
    }

    setItems((current) => [...current, { ...result.value, createdAt: result.value.createdAt }]);
  }

  async function remove(id: string): Promise<boolean> {
    const previous = items;
    setItems((current) => current.filter((item) => item.id !== id));
    const result = await deleteAttachmentAction({ attachmentId: id });
    if (!result.ok) {
      setItems(previous);
      setError(t("attachmentFailed"));
      return false;
    }
    return true;
  }

  return (
    <div>
      <h4 className="font-heading text-lg font-semibold text-foreground">
        {t("attachmentsTitle")}
      </h4>
      <p className="mt-1 text-sm text-muted-foreground">{t("attachmentsSubtitle")}</p>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="sr-only"
        tabIndex={-1}
        aria-label={t("uploadAttachment")}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file !== undefined) void upload(file);
        }}
      />

      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{t("attachmentsEmpty")}</p>
      ) : (
        <ul className="mt-3 divide-y divide-border rounded-sm border border-border">
          {items.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
              <span className="min-w-0 flex-1 truncate text-foreground">{item.title}</span>
              <span className="tabular text-muted-foreground" dir="ltr">
                {formatSize(item.sizeBytes)}
              </span>
              <a
                href={`/api/instructor/attachments/${item.id}`}
                target="_blank"
                rel="noreferrer noopener"
                className="font-medium text-primary hover:underline"
              >
                {t("download")}
              </a>
              <ConfirmDialog
                triggerLabel={t("deleteAttachment")}
                title={t("deleteAttachmentTitle")}
                description={t("deleteAttachmentBody", { title: item.title })}
                confirmLabel={t("deleteAttachmentConfirm")}
                cancelLabel={t("cancel")}
                errorLabel={t("attachmentFailed")}
                onConfirm={() => remove(item.id)}
              />
            </li>
          ))}
        </ul>
      )}

      {error !== null && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}

      <Button
        type="button"
        variant="secondary"
        className="mt-3"
        loading={pending}
        onClick={() => inputRef.current?.click()}
      >
        {pending ? t("uploading") : t("uploadAttachment")}
      </Button>
      <p className="mt-2 text-sm text-muted-foreground">{t("attachmentsHint")}</p>
    </div>
  );
}
