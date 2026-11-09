"use client";

import { Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitQuizAction } from "@/features/quizzes/actions";
import type { QuizTakingData } from "@/server/quizzes";
import { useRouter } from "@/i18n/navigation";

type AnswerState = { optionId?: string; optionIds?: string[]; text?: string };

function clock(seconds: number): string {
  const safe = Math.max(0, seconds);
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

/** Attempt form (P08-T02). Answers stay client-side until submission; the server grades. */
export function QuizForm({ data, locale }: { data: QuizTakingData; locale: "ar" | "en" }) {
  const t = useTranslations("Quiz");
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitted = useRef(false);
  const [remaining, setRemaining] = useState<number | null>(null);

  async function submit() {
    if (submitted.current) return;
    submitted.current = true;
    setPending(true);
    setError(null);

    const payload = data.questions.map((question) => {
      const answer = answers[question.id] ?? {};
      return {
        questionId: question.id,
        optionId: answer.optionId ?? null,
        optionIds: answer.optionIds ?? null,
        text: answer.text ?? null,
      };
    });
    const result = await submitQuizAction({ attemptId: data.attemptId, answers: payload });
    setPending(false);
    if (!result.ok) {
      setError(t("error"));
      submitted.current = false;
      return;
    }
    router.push(`?attempt=${data.attemptId}`);
    router.refresh();
  }

  useEffect(() => {
    if (data.expiresAt === null) return;
    const update = () => {
      const next = Math.max(0, Math.floor((data.expiresAt?.getTime() ?? 0) - Date.now()) / 1000);
      setRemaining(next);
      return next;
    };
    update();
    const timer = window.setInterval(() => {
      const next = Math.max(0, Math.floor((data.expiresAt?.getTime() ?? 0) - Date.now()) / 1000);
      setRemaining(next);
      if (next <= 0) {
        window.clearInterval(timer);
        void submit();
      }
    }, 1000);
    return () => window.clearInterval(timer);
    // submit is stable for the lifetime of the attempt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.expiresAt]);

  const unanswered = data.questions.filter((question) => {
    const answer = answers[question.id];
    if (answer === undefined) return true;
    if (question.type === "SHORT_ANSWER") return (answer.text ?? "").trim() === "";
    if (question.type === "MULTI_CHOICE") return (answer.optionIds ?? []).length === 0;
    return answer.optionId === undefined;
  }).length;

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      {remaining !== null && (
        <p
          role="timer"
          className="flex items-center gap-2 rounded-md border border-border bg-surface px-4 py-3 text-sm font-medium text-foreground"
        >
          <Clock className="size-4" aria-hidden="true" />
          {t("timeRemaining", { time: clock(remaining) })}
          <span className="text-xs font-normal text-muted-foreground">{t("autoSubmit")}</span>
        </p>
      )}

      <ol className="space-y-5">
        {data.questions.map((question, index) => {
          const prompt = locale === "en" ? question.promptEn : question.promptAr;
          const answer = answers[question.id] ?? {};
          return (
            <li key={question.id} className="rounded-md border border-border bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 className="font-medium text-foreground">
                  {t("questionOf", { current: index + 1, total: data.questions.length })}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {t("points", { points: question.points })}
                </span>
              </div>
              <p className="mt-2 text-foreground">{prompt}</p>

              {question.type === "SHORT_ANSWER" ? (
                <div className="mt-3 space-y-1">
                  <Label htmlFor={`answer-${question.id}`} className="sr-only">
                    {t("shortPlaceholder")}
                  </Label>
                  <Textarea
                    id={`answer-${question.id}`}
                    rows={2}
                    maxLength={2000}
                    placeholder={t("shortPlaceholder")}
                    value={answer.text ?? ""}
                    onChange={(event) =>
                      setAnswers((current) => ({
                        ...current,
                        [question.id]: { ...current[question.id], text: event.target.value },
                      }))
                    }
                  />
                </div>
              ) : (
                <fieldset className="mt-3 space-y-2">
                  <legend className="text-xs text-muted-foreground">
                    {question.type === "MULTI_CHOICE" ? t("selectMany") : t("selectOne")}
                  </legend>
                  {question.options.map((option) => {
                    const text = locale === "en" ? option.textEn : option.textAr;
                    const checked =
                      question.type === "MULTI_CHOICE"
                        ? (answer.optionIds ?? []).includes(option.id)
                        : answer.optionId === option.id;
                    return (
                      <label
                        key={option.id}
                        className="flex cursor-pointer items-start gap-2 rounded-sm px-1 py-1.5 text-sm text-foreground hover:bg-muted"
                      >
                        <input
                          type={question.type === "MULTI_CHOICE" ? "checkbox" : "radio"}
                          name={`question-${question.id}`}
                          value={option.id}
                          aria-label={text}
                          checked={checked}
                          onChange={() =>
                            setAnswers((current) => {
                              if (question.type === "MULTI_CHOICE") {
                                const selected = new Set(current[question.id]?.optionIds ?? []);
                                if (selected.has(option.id)) selected.delete(option.id);
                                else selected.add(option.id);
                                return {
                                  ...current,
                                  [question.id]: { optionIds: [...selected] },
                                };
                              }
                              return { ...current, [question.id]: { optionId: option.id } };
                            })
                          }
                          className="mt-0.5 accent-[var(--primary)]"
                        />
                        <span>{text}</span>
                      </label>
                    );
                  })}
                </fieldset>
              )}
            </li>
          );
        })}
      </ol>

      {unanswered > 0 && (
        <p role="status" className="text-sm text-warning">
          {t("unanswered", { count: unanswered })}
        </p>
      )}
      {error !== null && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <Button type="submit" loading={pending}>
        {pending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
