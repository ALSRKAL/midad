"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveCourseObjectivesAction } from "@/features/instructor-builder/actions";

/**
 * Course objectives (P04-T06, BR-02).
 *
 * At least three are required to submit. The list is saved as a whole, which makes ordering and
 * removal simple and keeps the transaction atomic.
 */
type Row = { textAr: string; textEn: string };

export function ObjectivesEditor({ courseId, initial }: { courseId: string; initial: Row[] }) {
  const t = useTranslations("CourseBuilder");
  const [rows, setRows] = useState<Row[]>(
    initial.length === 0 ? [{ textAr: "", textEn: "" }] : initial,
  );
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<"idle" | "saved" | "error">("idle");

  async function save() {
    setPending(true);
    setState("idle");
    const result = await saveCourseObjectivesAction({ courseId, objectives: rows });
    setPending(false);
    setState(result.ok ? "saved" : "error");
  }

  return (
    <div>
      <h3 className="font-heading text-lg font-semibold text-foreground">{t("objectivesTitle")}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{t("objectivesSubtitle")}</p>

      <ul className="mt-4 space-y-3">
        {rows.map((row, index) => (
          <li key={index} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <div className="space-y-1">
              <Label htmlFor={`objective-ar-${index}`}>
                {t("objectiveAr", { number: index + 1 })}
              </Label>
              <Input
                id={`objective-ar-${index}`}
                dir="rtl"
                maxLength={300}
                value={row.textAr}
                onChange={(event) =>
                  setRows((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, textAr: event.target.value } : item,
                    ),
                  )
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`objective-en-${index}`}>
                {t("objectiveEn", { number: index + 1 })}
              </Label>
              <Input
                id={`objective-en-${index}`}
                dir="ltr"
                maxLength={300}
                value={row.textEn}
                onChange={(event) =>
                  setRows((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, textEn: event.target.value } : item,
                    ),
                  )
                }
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={rows.length <= 1}
                aria-label={t("removeObjective", { number: index + 1 })}
                onClick={() => setRows((current) => current.filter((_, i) => i !== index))}
              >
                {t("removeObjectiveShort")}
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setRows((current) => [...current, { textAr: "", textEn: "" }])}
        >
          {t("addObjective")}
        </Button>
        <Button
          type="button"
          size="sm"
          loading={pending}
          onClick={() => {
            void save();
          }}
        >
          {t("saveObjectives")}
        </Button>
        {state === "saved" && (
          <span role="status" className="text-sm text-success">
            {t("objectivesSaved")}
          </span>
        )}
        {state === "error" && (
          <span role="alert" className="text-sm text-danger">
            {t("genericError")}
          </span>
        )}
      </div>
    </div>
  );
}
