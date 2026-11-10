import type { Metadata } from "next";
import { CheckCircle2, XCircle } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QuizForm } from "@/features/quizzes/components/quiz-form";
import type { Locale } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { getAttemptReview, getQuizAttemptForTaking } from "@/server/quizzes";
import { getCurrentSession } from "@/server/session";

/** Quiz attempt/review (P08-T02). Correctness only appears after submission. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; courseSlug: string; lessonId: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Quiz" });
  return { title: t("quizTitle"), robots: { index: false, follow: false } };
}

export default async function QuizPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; courseSlug: string; lessonId: string }>;
  searchParams: Promise<{ attempt?: string }>;
}) {
  const { locale, courseSlug, lessonId } = await params;
  const { attempt: attemptId } = await searchParams;
  setRequestLocale(locale);

  const user = await getCurrentSession();
  if (user === null) {
    redirect(
      `/${locale}/login?next=${encodeURIComponent(`/${locale}/learn/${courseSlug}/${lessonId}/quiz`)}`,
    );
  }
  if (attemptId === undefined) {
    redirect(`/${locale}/learn/${courseSlug}/${lessonId}`);
  }

  const localeValue: Locale = locale === "en" ? "en" : "ar";
  const t = await getTranslations({ locale, namespace: "Quiz" });
  const review = await getAttemptReview(user, attemptId);

  if (review !== null) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-10">
        <div
          className={`rounded-md border p-6 ${
            review.passed ? "border-success bg-success/5" : "border-danger bg-danger/5"
          }`}
        >
          <p className="flex items-center gap-2 font-heading text-xl font-semibold text-foreground">
            {review.passed ? (
              <CheckCircle2 className="size-6 text-success" aria-hidden="true" />
            ) : (
              <XCircle className="size-6 text-danger" aria-hidden="true" />
            )}
            {review.passed ? t("passBanner") : t("failBanner")}
          </p>
          <p className="mt-2 text-sm text-foreground">
            {t("score", { score: review.score, max: review.maxScore, pct: review.percentage })}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild variant="secondary">
              <Link href={`/learn/${courseSlug}/${lessonId}`}>{t("backToLesson")}</Link>
            </Button>
          </div>
        </div>

        <h1 className="mt-8 font-heading text-2xl font-semibold text-foreground">
          {localeValue === "en" ? review.titleEn : review.titleAr}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("reviewTitle")}</p>

        <ol className="mt-5 space-y-4">
          {review.questions.map((question, index) => {
            const prompt = localeValue === "en" ? question.promptEn : question.promptAr;
            const explanation =
              localeValue === "en" ? question.explanationEn : question.explanationAr;
            return (
              <li key={question.id} className="rounded-md border border-border bg-surface p-5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-medium text-foreground">
                    {t("questionOf", { current: index + 1, total: review.questions.length })}
                  </h2>
                  <Badge variant={question.earned === question.points ? "success" : "danger"}>
                    {`${question.earned}/${question.points}`}
                  </Badge>
                </div>
                <p className="mt-2 text-foreground">{prompt}</p>

                {question.type === "SHORT_ANSWER" ? (
                  <div className="mt-3 space-y-1 text-sm">
                    <p className="text-muted-foreground">
                      {t("yourAnswer")}:{" "}
                      <span className="text-foreground">
                        {question.textAnswer === null || question.textAnswer.trim() === ""
                          ? t("noAnswer")
                          : question.textAnswer}
                      </span>
                    </p>
                    <p className="text-muted-foreground">
                      {t("correctAnswer")}:{" "}
                      <span className="text-success">{question.acceptedAnswers.join(" / ")}</span>
                    </p>
                  </div>
                ) : (
                  <ul className="mt-3 space-y-1.5 text-sm">
                    {question.options.map((option) => {
                      const selected = question.selectedOptionIds.includes(option.id);
                      const text = localeValue === "en" ? option.textEn : option.textAr;
                      return (
                        <li
                          key={option.id}
                          className={
                            option.isCorrect
                              ? "rounded-sm border border-success bg-success/5 px-3 py-1.5 text-foreground"
                              : selected
                                ? "rounded-sm border border-danger bg-danger/5 px-3 py-1.5 text-foreground"
                                : "px-3 py-1.5 text-muted-foreground"
                          }
                        >
                          <span className="flex flex-wrap items-center gap-2">
                            {text}
                            {option.isCorrect && (
                              <Badge variant="success">{t("correctAnswer")}</Badge>
                            )}
                            {selected && <Badge variant="neutral">{t("yourAnswer")}</Badge>}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {explanation !== null && explanation !== undefined && explanation !== "" && (
                  <div className="mt-3 rounded-sm bg-muted p-3 text-sm text-foreground">
                    <p className="text-xs font-medium text-muted-foreground">{t("explanation")}</p>
                    <p className="mt-1">{explanation}</p>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  const taking = await getQuizAttemptForTaking(user, attemptId);
  if (taking === null) {
    return (
      <div className="mx-auto w-full max-w-xl px-6 py-16 text-center">
        <h1 className="font-heading text-2xl font-semibold text-foreground">{t("expired")}</h1>
        <Button asChild className="mt-6">
          <Link href={`/learn/${courseSlug}/${lessonId}`}>{t("backToLesson")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <h1 className="font-heading text-2xl font-semibold text-foreground">
        {localeValue === "en" ? taking.titleEn : taking.titleAr}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("passMark", { pct: taking.passPct })}</p>
      <div className="mt-6">
        <QuizForm data={taking} locale={localeValue} />
      </div>
    </div>
  );
}
