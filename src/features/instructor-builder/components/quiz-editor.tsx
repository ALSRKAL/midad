"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  addQuestionAction,
  deleteQuestionAction,
  saveQuestionAction,
  saveQuizSettingsAction,
} from "@/features/instructor-builder/lesson-content-actions";
import { useRouter } from "@/i18n/navigation";
import type { BuilderQuestion, BuilderQuiz, QuestionType } from "@/server/lesson-content";
import type { SerializedError } from "@/lib/errors";

/**
 * Quiz editor (P04-T05).
 *
 * Settings save with one button; every question is its own form so a long quiz does not lose work
 * when one field is invalid. Correctness is edited here (the builder owns it) but the server
 * re-validates it and student-facing queries never select it.
 */

function errorMessage(
  t: ReturnType<typeof useTranslations<"LessonContent">>,
  error: SerializedError,
): string {
  const code = error.fields === undefined ? undefined : Object.values(error.fields)[0]?.[0];
  switch (code) {
    case "PROMPT_REQUIRED":
      return t("promptRequired");
    case "OPTIONS_REQUIRED":
      return t("optionsRequired");
    case "CORRECT_REQUIRED":
      return t("correctRequired");
    case "ONE_CORRECT_REQUIRED":
      return t("oneCorrectRequired");
    case "ACCEPTED_REQUIRED":
      return t("acceptedRequired");
    case "POINTS_RANGE":
      return t("pointsRange");
    case "PASS_RANGE":
      return t("passRange");
    case "ATTEMPTS_RANGE":
      return t("attemptsRange");
    default:
      return t("genericError");
  }
}

function typeLabel(
  t: ReturnType<typeof useTranslations<"LessonContent">>,
  type: QuestionType,
): string {
  switch (type) {
    case "MULTI_CHOICE":
      return t("typeMulti");
    case "TRUE_FALSE":
      return t("typeTrueFalse");
    case "SHORT_ANSWER":
      return t("typeShort");
    default:
      return t("typeSingle");
  }
}

export function QuizEditor({
  courseId,
  lessonId,
  quiz,
}: {
  courseId: string;
  lessonId: string;
  quiz: BuilderQuiz;
}) {
  const t = useTranslations("LessonContent");
  const router = useRouter();

  const [settings, setSettings] = useState({
    titleAr: quiz.titleAr,
    titleEn: quiz.titleEn,
    descriptionAr: quiz.descriptionAr,
    descriptionEn: quiz.descriptionEn,
    passPct: String(quiz.passPct),
    maxAttempts: String(quiz.maxAttempts),
    timeLimit: quiz.timeLimitSec === null ? "" : String(Math.round(quiz.timeLimitSec / 60)),
    shuffleQuestions: quiz.shuffleQuestions,
    shuffleOptions: quiz.shuffleOptions,
  });
  const [settingsState, setSettingsState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const [newType, setNewType] = useState<QuestionType>("SINGLE_CHOICE");
  const [adding, setAdding] = useState(false);

  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSettingsState("saving");
    setSettingsError(null);

    const passPct = Number(settings.passPct);
    const maxAttempts = Number(settings.maxAttempts);
    const minutes = settings.timeLimit.trim() === "" ? null : Number(settings.timeLimit);

    if (!Number.isInteger(passPct) || passPct < 1 || passPct > 100) {
      setSettingsError(t("passRange"));
      setSettingsState("error");
      return;
    }
    if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 100) {
      setSettingsError(t("attemptsRange"));
      setSettingsState("error");
      return;
    }
    if (minutes !== null && (!Number.isFinite(minutes) || minutes < 1)) {
      setSettingsError(t("genericError"));
      setSettingsState("error");
      return;
    }

    const result = await saveQuizSettingsAction({
      courseId,
      lessonId,
      titleAr: settings.titleAr,
      titleEn: settings.titleEn,
      descriptionAr: settings.descriptionAr,
      descriptionEn: settings.descriptionEn,
      passPct,
      maxAttempts,
      timeLimitSec: minutes === null ? null : Math.round(minutes * 60),
      shuffleQuestions: settings.shuffleQuestions,
      shuffleOptions: settings.shuffleOptions,
    });

    if (!result.ok) {
      setSettingsError(errorMessage(t, result.error));
      setSettingsState("error");
      return;
    }
    setSettingsState("saved");
  }

  async function addQuestion() {
    setAdding(true);
    const result = await addQuestionAction({ courseId, lessonId, type: newType });
    setAdding(false);
    if (result.ok) router.refresh();
  }

  return (
    <div className="space-y-8">
      <section aria-labelledby="quiz-settings-title">
        <h4 id="quiz-settings-title" className="font-heading text-lg font-semibold text-foreground">
          {t("quizSettingsTitle")}
        </h4>
        <form onSubmit={(event) => void saveSettings(event)} className="mt-3 space-y-4" noValidate>
          {settingsError !== null && (
            <p
              role="alert"
              className="rounded-sm border border-danger px-3 py-2 text-sm text-danger"
            >
              {settingsError}
            </p>
          )}
          {settingsState === "saved" && (
            <p
              role="status"
              className="rounded-sm border border-success px-3 py-2 text-sm text-success"
            >
              {t("settingsSaved")}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="quiz-title-ar">{t("quizTitleAr")}</Label>
              <Input
                id="quiz-title-ar"
                dir="rtl"
                maxLength={160}
                value={settings.titleAr}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, titleAr: event.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="quiz-title-en">{t("quizTitleEn")}</Label>
              <Input
                id="quiz-title-en"
                dir="ltr"
                maxLength={160}
                value={settings.titleEn}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, titleEn: event.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="quiz-desc-ar">{t("quizDescriptionAr")}</Label>
              <Textarea
                id="quiz-desc-ar"
                dir="rtl"
                rows={3}
                maxLength={2000}
                value={settings.descriptionAr}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, descriptionAr: event.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="quiz-desc-en">{t("quizDescriptionEn")}</Label>
              <Textarea
                id="quiz-desc-en"
                dir="ltr"
                rows={3}
                maxLength={2000}
                value={settings.descriptionEn}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, descriptionEn: event.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="quiz-pass">{t("passPct")}</Label>
              <Input
                id="quiz-pass"
                type="number"
                min={1}
                max={100}
                value={settings.passPct}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, passPct: event.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="quiz-attempts">{t("maxAttempts")}</Label>
              <Input
                id="quiz-attempts"
                type="number"
                min={1}
                max={100}
                value={settings.maxAttempts}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, maxAttempts: event.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="quiz-time">{t("timeLimitMinutes")}</Label>
              <Input
                id="quiz-time"
                type="number"
                min={1}
                value={settings.timeLimit}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, timeLimit: event.target.value }))
                }
              />
              <p className="text-xs text-muted-foreground">{t("timeLimitHint")}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Switch
                aria-label={t("shuffleQuestions")}
                checked={settings.shuffleQuestions}
                onCheckedChange={(checked) =>
                  setSettings((current) => ({ ...current, shuffleQuestions: checked }))
                }
              />
              {t("shuffleQuestions")}
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Switch
                aria-label={t("shuffleOptions")}
                checked={settings.shuffleOptions}
                onCheckedChange={(checked) =>
                  setSettings((current) => ({ ...current, shuffleOptions: checked }))
                }
              />
              {t("shuffleOptions")}
            </label>
          </div>

          <Button type="submit" loading={settingsState === "saving"}>
            {settingsState === "saving" ? t("savingSettings") : t("saveSettings")}
          </Button>
        </form>
      </section>

      <section aria-labelledby="quiz-questions-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h4
            id="quiz-questions-title"
            className="font-heading text-lg font-semibold text-foreground"
          >
            {t("questionsTitle")}
          </h4>
          <div className="flex items-end gap-2">
            <div className="space-y-1">
              <Label htmlFor="new-question-type">{t("questionType")}</Label>
              <Select
                id="new-question-type"
                value={newType}
                onChange={(event) => setNewType(event.target.value as QuestionType)}
                containerClassName="w-auto"
                className="h-9 pe-8 text-sm"
              >
                <option value="SINGLE_CHOICE">{t("typeSingle")}</option>
                <option value="MULTI_CHOICE">{t("typeMulti")}</option>
                <option value="TRUE_FALSE">{t("typeTrueFalse")}</option>
                <option value="SHORT_ANSWER">{t("typeShort")}</option>
              </Select>
            </div>
            <Button type="button" loading={adding} onClick={() => void addQuestion()}>
              {adding ? t("addingQuestion") : t("addQuestion")}
            </Button>
          </div>
        </div>

        {quiz.questions.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">{t("noQuestions")}</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {quiz.questions.map((question, index) => (
              <li key={question.id}>
                <QuestionCard
                  courseId={courseId}
                  lessonId={lessonId}
                  question={question}
                  number={index + 1}
                  onDeleted={() => router.refresh()}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

type OptionDraft = { textAr: string; textEn: string; isCorrect: boolean };

function QuestionCard({
  courseId,
  lessonId,
  question,
  number,
  onDeleted,
}: {
  courseId: string;
  lessonId: string;
  question: BuilderQuestion;
  number: number;
  onDeleted: () => void;
}) {
  const t = useTranslations("LessonContent");
  const [promptAr, setPromptAr] = useState(question.promptAr);
  const [promptEn, setPromptEn] = useState(question.promptEn);
  const [explanationAr, setExplanationAr] = useState(question.explanationAr);
  const [explanationEn, setExplanationEn] = useState(question.explanationEn);
  const [points, setPoints] = useState(String(question.points));
  const [options, setOptions] = useState<OptionDraft[]>(
    question.options.map((option) => ({
      textAr: option.textAr,
      textEn: option.textEn,
      isCorrect: option.isCorrect,
    })),
  );
  const [accepted, setAccepted] = useState(question.acceptedAnswers.join("\n"));
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const isChoice = question.type !== "SHORT_ANSWER";
  const isSingle = question.type === "SINGLE_CHOICE" || question.type === "TRUE_FALSE";
  const fixedOptions = question.type === "TRUE_FALSE";

  function setCorrect(index: number, checked: boolean) {
    setOptions((current) =>
      current.map((option, optionIndex) => {
        if (isSingle) return { ...option, isCorrect: optionIndex === index };
        return optionIndex === index ? { ...option, isCorrect: checked } : option;
      }),
    );
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsedPoints = Number(points);
    if (!Number.isInteger(parsedPoints) || parsedPoints < 1 || parsedPoints > 100) {
      setError(t("pointsRange"));
      setState("error");
      return;
    }

    setState("saving");
    const result = await saveQuestionAction({
      courseId,
      lessonId,
      questionId: question.id,
      promptAr,
      promptEn,
      explanationAr,
      explanationEn,
      points: parsedPoints,
      acceptedAnswers: accepted
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line !== ""),
      options: isChoice ? options : [],
    });

    if (!result.ok) {
      setError(errorMessage(t, result.error));
      setState("error");
      return;
    }
    setState("saved");
  }

  return (
    <form
      onSubmit={(event) => void save(event)}
      className="rounded-md border border-border bg-surface p-5"
      noValidate
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium text-foreground">{`${number}. ${typeLabel(t, question.type)}`}</p>
        <div className="flex items-end gap-2">
          <div className="space-y-1">
            <Label htmlFor={`points-${question.id}`}>{t("points")}</Label>
            <Input
              id={`points-${question.id}`}
              type="number"
              min={1}
              max={100}
              className="h-9 w-20"
              value={points}
              onChange={(event) => setPoints(event.target.value)}
            />
          </div>
          <ConfirmDialog
            triggerLabel={t("deleteQuestion")}
            title={t("deleteQuestionTitle")}
            description={t("deleteQuestionBody")}
            confirmLabel={t("deleteQuestionConfirm")}
            cancelLabel={t("cancel")}
            errorLabel={t("genericError")}
            onConfirm={async () => {
              const result = await deleteQuestionAction({
                courseId,
                lessonId,
                questionId: question.id,
              });
              if (!result.ok) return false;
              onDeleted();
              return true;
            }}
          />
        </div>
      </div>

      {error !== null && (
        <p
          role="alert"
          className="mt-3 rounded-sm border border-danger px-3 py-2 text-sm text-danger"
        >
          {error}
        </p>
      )}
      {state === "saved" && (
        <p
          role="status"
          className="mt-3 rounded-sm border border-success px-3 py-2 text-sm text-success"
        >
          {t("questionSaved")}
        </p>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor={`prompt-ar-${question.id}`}>{t("promptAr")}</Label>
          <Textarea
            id={`prompt-ar-${question.id}`}
            dir="rtl"
            rows={2}
            value={promptAr}
            onChange={(event) => setPromptAr(event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`prompt-en-${question.id}`}>{t("promptEn")}</Label>
          <Textarea
            id={`prompt-en-${question.id}`}
            dir="ltr"
            rows={2}
            value={promptEn}
            onChange={(event) => setPromptEn(event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`exp-ar-${question.id}`}>{t("explanationAr")}</Label>
          <Textarea
            id={`exp-ar-${question.id}`}
            dir="rtl"
            rows={2}
            value={explanationAr}
            onChange={(event) => setExplanationAr(event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`exp-en-${question.id}`}>{t("explanationEn")}</Label>
          <Textarea
            id={`exp-en-${question.id}`}
            dir="ltr"
            rows={2}
            value={explanationEn}
            onChange={(event) => setExplanationEn(event.target.value)}
          />
        </div>
      </div>

      {isChoice ? (
        <fieldset className="mt-4">
          <legend className="text-sm font-medium text-foreground">{t("optionsTitle")}</legend>
          <ul className="mt-2 space-y-2">
            {options.map((option, index) => (
              <li key={index} className="flex flex-wrap items-center gap-2">
                <input
                  type={isSingle ? "radio" : "checkbox"}
                  name={`correct-${question.id}`}
                  checked={option.isCorrect}
                  onChange={(event) => setCorrect(index, event.target.checked)}
                  aria-label={`${t("correct")} ${index + 1}`}
                  className="size-4 accent-primary"
                />
                <Input
                  dir="rtl"
                  aria-label={`${t("optionAr")} ${index + 1}`}
                  value={option.textAr}
                  maxLength={500}
                  onChange={(event) =>
                    setOptions((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, textAr: event.target.value } : item,
                      ),
                    )
                  }
                />
                <Input
                  dir="ltr"
                  aria-label={`${t("optionEn")} ${index + 1}`}
                  value={option.textEn}
                  maxLength={500}
                  onChange={(event) =>
                    setOptions((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, textEn: event.target.value } : item,
                      ),
                    )
                  }
                />
                {!fixedOptions && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label={`${t("removeOption")} ${index + 1}`}
                    disabled={options.length <= 2}
                    onClick={() =>
                      setOptions((current) => current.filter((_, itemIndex) => itemIndex !== index))
                    }
                  >
                    {t("removeOption")}
                  </Button>
                )}
              </li>
            ))}
          </ul>
          {!fixedOptions && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-2"
              onClick={() =>
                setOptions((current) => [...current, { textAr: "", textEn: "", isCorrect: false }])
              }
            >
              {t("addOption")}
            </Button>
          )}
        </fieldset>
      ) : (
        <div className="mt-4 space-y-1">
          <Label htmlFor={`accepted-${question.id}`}>{t("acceptedAnswers")}</Label>
          <Textarea
            id={`accepted-${question.id}`}
            rows={3}
            value={accepted}
            onChange={(event) => setAccepted(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">{t("acceptedHint")}</p>
        </div>
      )}

      <Button type="submit" className="mt-4" loading={state === "saving"}>
        {state === "saving" ? t("savingQuestion") : t("saveQuestion")}
      </Button>
    </form>
  );
}
