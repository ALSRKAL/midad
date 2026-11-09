"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { uploadCourseCoverAction } from "@/features/instructor-builder/actions";

/**
 * Course cover upload (P04-T02).
 *
 * The file is checked in the browser for a fast translation, then checked again on the server by
 * magic bytes and size before it reaches the public bucket. The returned URL is shown immediately;
 * no full page reload is needed.
 */
const ACCEPTED = ["image/png", "image/jpeg", "image/webp"] as const;
const MAX_BYTES = 5 * 1024 * 1024;

export function CourseCoverUploader({
  courseId,
  initialUrl,
}: {
  courseId: string;
  initialUrl: string | null;
}) {
  const t = useTranslations("CourseBuilder");
  const inputRef = useRef<HTMLInputElement>(null);
  const [src, setSrc] = useState(initialUrl);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setError(null);

    if (!ACCEPTED.includes(file.type as (typeof ACCEPTED)[number])) {
      setError(t("coverUnsupported"));
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(t("coverTooLarge"));
      return;
    }

    setPending(true);
    const formData = new FormData();
    formData.append("courseId", courseId);
    formData.append("cover", file);

    const result = await uploadCourseCoverAction(formData);
    setPending(false);

    if (!result.ok) {
      setError(t("coverFailed"));
      return;
    }

    setSrc(result.value.coverUrl);
  }

  return (
    <div>
      <div className="relative aspect-video overflow-hidden rounded-md border border-border bg-muted">
        {src === null ? (
          <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
            {t("coverHint")}
          </div>
        ) : (
          <Image
            src={src}
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 360px"
            className="object-cover"
          />
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="sr-only"
        tabIndex={-1}
        aria-label={t("chooseCover")}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file !== undefined) void upload(file);
        }}
      />

      <Button
        type="button"
        variant="secondary"
        className="mt-3 w-full"
        loading={pending}
        onClick={() => inputRef.current?.click()}
      >
        {t("chooseCover")}
      </Button>
      <p className="mt-2 text-sm text-muted-foreground">{t("coverHint")}</p>
      {error !== null && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
