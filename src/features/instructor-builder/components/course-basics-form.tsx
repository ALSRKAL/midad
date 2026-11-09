"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { updateCourseBasicsAction } from "@/features/instructor-builder/actions";
import type { CourseBasicsInput } from "@/features/instructor-builder/schema";

/**
 * Basics form with debounced autosave (P04-T02).
 *
 * Every change schedules one save 800 ms later; a newer keystroke cancels the pending timer. The
 * revision counter makes sure a slow response cannot mark newer edits as saved. Leaving the page
 * flushes the latest values, and closing the tab while dirty triggers the browser's warning.
 */

type Values = Omit<CourseBasicsInput, "courseId">;
type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

function fieldMessage(
  t: ReturnType<typeof useTranslations<"CourseBuilder">>,
  code: string | undefined,
): string {
  switch (code) {
    case "TITLE_TOO_LONG":
      return t("titleTooLong");
    case "SUBTITLE_TOO_LONG":
      return t("subtitleTooLong");
    case "DESCRIPTION_TOO_LONG":
      return t("descriptionTooLong");
    case "CATEGORY_REQUIRED":
      return t("categoryRequired");
    default:
      return t("genericError");
  }
}

export function CourseBasicsForm({
  courseId,
  initial,
  categories,
}: {
  courseId: string;
  initial: Values;
  categories: Array<{ id: string; nameAr: string; nameEn: string }>;
}) {
  const t = useTranslations("CourseBuilder");
  const catalogT = useTranslations("Catalog");
  const [values, setValues] = useState<Values>(initial);
  const [state, setState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef<Values>(initial);
  const dirty = useRef(false);
  const revision = useRef(0);

  async function save(next: Values, rev: number) {
    setState("saving");
    const result = await updateCourseBasicsAction({ courseId, ...next });

    if (!result.ok) {
      const code =
        result.error.fields === undefined ? undefined : Object.values(result.error.fields)[0]?.[0];
      setError(fieldMessage(t, code));
      setState("error");
      return;
    }

    setError(null);
    if (revision.current === rev) {
      dirty.current = false;
      setState("saved");
    } else {
      // A newer change arrived while this request was in flight; its timer owns the next save.
      setState("dirty");
    }
  }

  function change(patch: Partial<Values>) {
    const next = { ...latest.current, ...patch };
    latest.current = next;
    setValues(next);
    revision.current += 1;
    dirty.current = true;
    setState("dirty");
    setError(null);

    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void save(next, revision.current);
    }, 800);
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
      // Internal navigation does not fire beforeunload; flush the pending edit instead of losing it.
      if (dirty.current) {
        void updateCourseBasicsAction({ courseId, ...latest.current });
      }
    };
  }, [courseId]);

  const statusText =
    state === "saving"
      ? t("autosaveSaving")
      : state === "saved"
        ? t("autosaveSaved")
        : state === "error"
          ? t("autosaveError")
          : state === "dirty"
            ? t("autosavePending")
            : "";

  return (
    <form onSubmit={(event) => event.preventDefault()} className="space-y-6" noValidate>
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

      <p className="text-sm text-muted-foreground">{t("leaveWarning")}</p>

      <div className="grid gap-6 lg:grid-cols-2">
        <fieldset className="space-y-4 rounded-md border border-border bg-surface p-5">
          <legend className="px-1 font-heading text-lg font-semibold text-foreground">
            {t("arabicContent")}
          </legend>

          <div className="space-y-2">
            <Label htmlFor="titleAr">{t("titleLabel")}</Label>
            <Input
              id="titleAr"
              dir="rtl"
              maxLength={160}
              value={values.titleAr}
              onChange={(event) => change({ titleAr: event.target.value })}
            />
            <p className="text-sm text-muted-foreground">{t("titleHint")}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitleAr">{t("subtitleLabel")}</Label>
            <Input
              id="subtitleAr"
              dir="rtl"
              maxLength={200}
              value={values.subtitleAr}
              onChange={(event) => change({ subtitleAr: event.target.value })}
            />
            <p className="text-sm text-muted-foreground">{t("subtitleHint")}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descriptionAr">{t("descriptionLabel")}</Label>
            <Textarea
              id="descriptionAr"
              dir="rtl"
              rows={7}
              maxLength={5000}
              value={values.descriptionAr}
              onChange={(event) => change({ descriptionAr: event.target.value })}
            />
            <p className="text-sm text-muted-foreground">{t("descriptionHint")}</p>
          </div>
        </fieldset>

        <fieldset className="space-y-4 rounded-md border border-border bg-surface p-5">
          <legend className="px-1 font-heading text-lg font-semibold text-foreground">
            {t("englishContent")}
          </legend>

          <div className="space-y-2">
            <Label htmlFor="titleEn">{t("titleLabel")}</Label>
            <Input
              id="titleEn"
              dir="ltr"
              maxLength={160}
              value={values.titleEn}
              onChange={(event) => change({ titleEn: event.target.value })}
            />
            <p className="text-sm text-muted-foreground">{t("titleHint")}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitleEn">{t("subtitleLabel")}</Label>
            <Input
              id="subtitleEn"
              dir="ltr"
              maxLength={200}
              value={values.subtitleEn}
              onChange={(event) => change({ subtitleEn: event.target.value })}
            />
            <p className="text-sm text-muted-foreground">{t("subtitleHint")}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descriptionEn">{t("descriptionLabel")}</Label>
            <Textarea
              id="descriptionEn"
              dir="ltr"
              rows={7}
              maxLength={5000}
              value={values.descriptionEn}
              onChange={(event) => change({ descriptionEn: event.target.value })}
            />
            <p className="text-sm text-muted-foreground">{t("descriptionHint")}</p>
          </div>
        </fieldset>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="categoryId">{t("categoryLabel")}</Label>
          <Select
            id="categoryId"
            value={values.categoryId}
            onChange={(event) => change({ categoryId: event.target.value })}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.nameAr}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="level">{t("levelLabel")}</Label>
          <Select
            id="level"
            value={values.level}
            onChange={(event) => change({ level: event.target.value as Values["level"] })}
          >
            <option value="ALL_LEVELS">{catalogT("levelAll")}</option>
            <option value="BEGINNER">{catalogT("levelBeginner")}</option>
            <option value="INTERMEDIATE">{catalogT("levelIntermediate")}</option>
            <option value="ADVANCED">{catalogT("levelAdvanced")}</option>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="language">{t("languageLabel")}</Label>
          <Select
            id="language"
            value={values.language}
            onChange={(event) => change({ language: event.target.value as Values["language"] })}
          >
            <option value="AR">{catalogT("courseLanguageAr")}</option>
            <option value="EN">{catalogT("courseLanguageEn")}</option>
          </Select>
        </div>
      </div>
    </form>
  );
}
