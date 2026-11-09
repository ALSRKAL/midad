"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/features/instructor-builder/components/rich-text-editor";
import { saveLessonTextAction } from "@/features/instructor-builder/lesson-content-actions";

/**
 * Text lesson content (P04-T05): two editors, debounced autosave, and a visible character count so
 * the BR-02 rule (200 characters in at least one language) can be met while writing.
 */
type Values = { contentAr: string; contentEn: string };
type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

export function TextLessonEditor({
  courseId,
  lessonId,
  initial,
  initialLengths,
}: {
  courseId: string;
  lessonId: string;
  initial: Values;
  initialLengths: { ar: number; en: number };
}) {
  const t = useTranslations("LessonContent");
  const [lengths, setLengths] = useState(initialLengths);
  const [state, setState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef<Values>(initial);
  const dirty = useRef(false);
  const revision = useRef(0);

  async function save(next: Values, rev: number) {
    setState("saving");
    const result = await saveLessonTextAction({ courseId, lessonId, ...next });
    if (!result.ok) {
      setError(t("saveError"));
      setState("error");
      return;
    }
    setError(null);
    if (revision.current === rev) {
      dirty.current = false;
      setState("saved");
    }
  }

  function change(patch: Partial<Values>) {
    const next = { ...latest.current, ...patch };
    latest.current = next;
    revision.current += 1;
    dirty.current = true;
    setState("dirty");
    setError(null);

    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void save(next, revision.current);
    }, 900);
  }

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (dirty.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      if (timer.current !== null) clearTimeout(timer.current);
      if (dirty.current) {
        void saveLessonTextAction({ courseId, lessonId, ...latest.current });
      }
    };
  }, [courseId, lessonId]);

  const statusText =
    state === "saving"
      ? t("saving")
      : state === "saved"
        ? t("saved")
        : state === "error"
          ? t("saveError")
          : state === "dirty"
            ? t("pendingSave")
            : "";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {statusText}
        </p>
        {state === "error" && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              void save(latest.current, revision.current);
            }}
          >
            {t("retry")}
          </Button>
        )}
      </div>

      {error !== null && (
        <p role="alert" className="rounded-sm border border-danger px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-heading text-lg font-semibold text-foreground">{t("arabic")}</h4>
            <span className="text-sm text-muted-foreground">
              {t("charsCount", { count: lengths.ar })}
            </span>
          </div>
          <RichTextEditor
            id="text-content-ar"
            label={`${t("arabic")} — ${t("editorLabel")}`}
            initialContent={initial.contentAr}
            dir="rtl"
            onChange={(html) => change({ contentAr: html })}
            onLengthChange={(length) => setLengths((current) => ({ ...current, ar: length }))}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-heading text-lg font-semibold text-foreground">{t("english")}</h4>
            <span className="text-sm text-muted-foreground">
              {t("charsCount", { count: lengths.en })}
            </span>
          </div>
          <RichTextEditor
            id="text-content-en"
            label={`${t("english")} — ${t("editorLabel")}`}
            initialContent={initial.contentEn}
            dir="ltr"
            onChange={(html) => change({ contentEn: html })}
            onLengthChange={(length) => setLengths((current) => ({ ...current, en: length }))}
          />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{t("minCharsHint")}</p>
    </div>
  );
}
