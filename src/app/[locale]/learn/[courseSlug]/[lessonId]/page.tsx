import type { Metadata } from "next";
import { CheckCircle2, ChevronLeft, ChevronRight, FileText, Lock, PlayCircle } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { LessonDiscussion } from "@/features/discussions/components/lesson-discussion";
import { LessonNotes } from "@/features/discussions/components/lesson-notes";
import { LessonCompleteButton } from "@/features/player/components/lesson-complete-button";
import { LessonTabs } from "@/features/player/components/lesson-tabs";
import { StartQuizButton } from "@/features/quizzes/components/start-quiz-button";
import { VideoPlayer } from "@/features/player/components/video-player";
import type { Locale } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { formatDurationLabel } from "@/lib/progress";
import { listNotes, listThreads } from "@/server/discussions";
import { getQuizOverview } from "@/server/quizzes";
import { getPlayerData } from "@/server/player";
import { getCurrentSession } from "@/server/session";

/** Lesson player shell (P07-T02): guarded content, curriculum sidebar, prev/next. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; courseSlug: string; lessonId: string }>;
}): Promise<Metadata> {
  const { locale, courseSlug, lessonId } = await params;
  const user = await getCurrentSession();
  const data = await getPlayerData(user, courseSlug, lessonId);
  const t = await getTranslations({ locale, namespace: "Player" });
  const title =
    data === null
      ? t("title")
      : locale === "en"
        ? (data.course.titleEn ?? data.course.titleAr ?? t("title"))
        : (data.course.titleAr ?? data.course.titleEn ?? t("title"));
  return { title, robots: { index: false, follow: false } };
}

export default async function LearnPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; courseSlug: string; lessonId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { locale, courseSlug, lessonId } = await params;
  const { tab } = await searchParams;
  setRequestLocale(locale);

  const user = await getCurrentSession();
  const data = await getPlayerData(user, courseSlug, lessonId);
  if (data === null) notFound();

  const localeValue: Locale = locale === "en" ? "en" : "ar";
  const t = await getTranslations({ locale, namespace: "Player" });
  const titleOf = (lesson: { titleAr: string; titleEn: string }) =>
    localeValue === "en" ? lesson.titleEn : lesson.titleAr;
  const courseTitle =
    localeValue === "en"
      ? (data.course.titleAr ?? data.course.titleEn ?? "")
      : (data.course.titleAr ?? data.course.titleEn ?? "");

  if (data.access === "LOGIN_REQUIRED") {
    redirect(
      `/${locale}/login?next=${encodeURIComponent(`/${locale}/learn/${courseSlug}/${lessonId}`)}`,
    );
  }

  if (data.access === "ENROLLMENT_REQUIRED") {
    return (
      <div className="mx-auto w-full max-w-xl px-6 py-16 text-center">
        <Lock className="mx-auto size-10 text-muted-foreground" aria-hidden="true" />
        <h1 className="mt-4 font-heading text-2xl font-semibold text-foreground">
          {t("notEnrolled")}
        </h1>
        <Button asChild className="mt-6">
          <Link href={`/courses/${courseSlug}`}>{t("backToCourse")}</Link>
        </Button>
      </div>
    );
  }

  const current = data.current;
  const content =
    localeValue === "en"
      ? (current.contentEn ?? current.contentAr)
      : (current.contentAr ?? current.contentEn);

  const showCommunity = user !== null && (data.course.enrollmentId !== null || data.course.isOwner);
  const [notes, threads] = showCommunity
    ? await Promise.all([
        listNotes(user.id, current.id),
        listThreads(user, data.course.id, current.id),
      ])
    : [[], []];
  const quiz =
    current.type === "QUIZ" && user !== null && data.course.enrollmentId !== null
      ? await getQuizOverview(user, current.id)
      : null;
  const quizT = await getTranslations({ locale, namespace: "Quiz" });

  return (
    <div className="mx-auto w-full max-w-(--container-page) px-6 py-8">
      <div className="grid items-start gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <aside
          aria-labelledby="curriculum-title"
          className="order-2 rounded-md border border-border bg-surface p-4 lg:sticky lg:top-24 lg:order-1"
        >
          <Link
            href={`/courses/${courseSlug}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            {courseTitle}
          </Link>
          <h2
            id="curriculum-title"
            className="mt-3 font-heading text-lg font-semibold text-foreground"
          >
            {t("curriculum")}
          </h2>
          <div className="mt-2">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${data.course.progressPct}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("progress", { pct: data.course.progressPct })}
            </p>
          </div>

          <nav aria-label={t("curriculum")} className="mt-4 max-h-[65vh] overflow-y-auto">
            {data.sections.map((section) => (
              <div key={section.id} className="mb-3">
                <h3 className="px-2 py-1 text-xs font-medium text-muted-foreground">
                  {localeValue === "en" ? section.titleEn : section.titleAr}
                </h3>
                <ul className="space-y-0.5">
                  {section.lessons.map((lesson) => {
                    const active = lesson.id === current.id;
                    const locked = !lesson.isPreview && !data.course.canViewPaid;
                    return (
                      <li key={lesson.id}>
                        <Link
                          href={`/learn/${courseSlug}/${lesson.id}`}
                          aria-current={active ? "page" : undefined}
                          className={`flex items-start gap-2 rounded-sm px-2 py-2 text-sm ${
                            active
                              ? "bg-muted font-medium text-foreground"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          {lesson.completed ? (
                            <CheckCircle2
                              className="mt-0.5 size-4 shrink-0 text-success"
                              aria-hidden="true"
                            />
                          ) : locked ? (
                            <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                          ) : lesson.type === "VIDEO" ? (
                            <PlayCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                          ) : (
                            <FileText className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                          )}
                          <span className="flex-1">{titleOf(lesson)}</span>
                          {lesson.isPreview && (
                            <span className="text-[0.65rem] font-medium text-primary">
                              {t("preview")}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        <main className="order-1 min-w-0 lg:order-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-primary">{courseTitle}</p>
              <h1 className="mt-1 font-heading text-2xl font-semibold text-foreground">
                {titleOf(current)}
              </h1>
            </div>
            {current.isPreview && (
              <span className="rounded-sm border border-accent/40 bg-accent/15 px-2 py-1 text-xs font-medium text-foreground">
                {t("preview")}
              </span>
            )}
          </div>

          <div className="mt-5">
            {current.type === "VIDEO" &&
              (current.video?.srcUrl !== null &&
              current.video?.srcUrl !== undefined &&
              current.video.srcType !== null ? (
                <VideoPlayer
                  lessonId={current.id}
                  srcUrl={current.video.srcUrl}
                  srcType={current.video.srcType}
                  posterUrl={current.video.posterUrl}
                  captionsUrl={current.video.captionsUrl}
                  initialPosition={current.positionSec}
                  locale={localeValue}
                />
              ) : (
                <p className="rounded-md border border-border bg-surface p-6 text-sm text-muted-foreground">
                  {t("videoNotReady")}
                </p>
              ))}

            {current.type === "TEXT" && (
              <article className="rounded-md border border-border bg-surface p-6">
                {content === null || content === "" ? (
                  <p className="text-sm text-muted-foreground">{t("textEmpty")}</p>
                ) : (
                  <div
                    className="rich-text text-foreground"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                )}
              </article>
            )}

            {current.type === "QUIZ" &&
              (quiz === null ? (
                <p className="rounded-md border border-border bg-surface p-6 text-sm text-muted-foreground">
                  {t("quizInfo")}
                </p>
              ) : (
                <section
                  aria-labelledby="quiz-title"
                  className="rounded-md border border-border bg-surface p-6"
                >
                  <h2
                    id="quiz-title"
                    className="font-heading text-lg font-semibold text-foreground"
                  >
                    {localeValue === "en" ? quiz.quizTitleEn : quiz.quizTitleAr}
                  </h2>
                  <dl className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
                    <div>
                      <dt className="text-xs">{quizT("passMark", { pct: quiz.passPct })}</dt>
                    </div>
                    <div>
                      <dd>
                        {quizT("attemptsUsed", { used: quiz.attemptsUsed, max: quiz.maxAttempts })}
                      </dd>
                    </div>
                    <div>
                      <dd>
                        {quiz.timeLimitSec === null
                          ? quizT("noLimit")
                          : quizT("timeLimit", { minutes: Math.round(quiz.timeLimitSec / 60) })}
                      </dd>
                    </div>
                  </dl>
                  {quiz.bestPercentage !== null && (
                    <p className="mt-2 text-sm text-foreground">
                      {quizT("bestScore", { pct: quiz.bestPercentage })}
                    </p>
                  )}
                  <div className="mt-4">
                    <StartQuizButton
                      lessonId={current.id}
                      courseSlug={courseSlug}
                      canStart={quiz.attemptsUsed < quiz.maxAttempts}
                      hasInProgress={quiz.hasInProgressAttempt}
                    />
                  </div>
                  {quiz.attempts.length > 0 && (
                    <>
                      <h3 className="mt-5 text-sm font-medium text-foreground">
                        {quizT("attemptsTitle")}
                      </h3>
                      <ul className="mt-2 space-y-1 text-sm">
                        {quiz.attempts.map((attempt) => (
                          <li key={attempt.id} className="flex items-center gap-2">
                            <span className={attempt.passed ? "text-success" : "text-danger"}>
                              {attempt.passed ? quizT("passed") : quizT("failed")}
                            </span>
                            <span className="tabular text-muted-foreground">
                              {attempt.percentage}%
                            </span>
                            <Link
                              href={`/learn/${courseSlug}/${current.id}/quiz?attempt=${attempt.id}`}
                              className="text-primary hover:underline"
                            >
                              {quizT("reviewLink")}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </section>
              ))}
          </div>

          {user !== null && data.course.enrollmentId !== null && (
            <LessonCompleteButton
              lessonId={current.id}
              completed={current.completed}
              type={current.type}
            />
          )}

          <LessonTabs
            showCommunity={showCommunity}
            initialTab={
              tab === "notes" || tab === "questions" || tab === "attachments" ? tab : "overview"
            }
            overview={
              <div className="rounded-md border border-border bg-surface p-5 text-sm text-foreground">
                <p>{t("durationLabel", { duration: formatDurationLabel(current.durationSec) })}</p>
              </div>
            }
            notes={
              <LessonNotes
                lessonId={current.id}
                notes={notes.map((note) => ({ ...note, createdAt: note.createdAt.toISOString() }))}
              />
            }
            questions={
              user === null ? null : (
                <LessonDiscussion
                  courseId={data.course.id}
                  lessonId={current.id}
                  currentUserId={user.id}
                  threads={threads.map((thread) => ({
                    ...thread,
                    createdAt: thread.createdAt.toISOString(),
                    replies: thread.replies.map((reply) => ({
                      ...reply,
                      createdAt: reply.createdAt.toISOString(),
                    })),
                  }))}
                />
              )
            }
            attachments={
              <div>
                {current.attachments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("fileNoAttachments")}</p>
                ) : (
                  <ul className="space-y-2">
                    {current.attachments.map((attachment) => (
                      <li key={attachment.id}>
                        <a
                          href={`/api/player/attachments/${attachment.id}`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          {localeValue === "en" ? attachment.titleEn : attachment.titleAr}
                          <span className="ms-2 text-xs text-muted-foreground">
                            {t("fileSizeKb", { size: Math.ceil(attachment.sizeBytes / 1024) })}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            }
          />

          <nav className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-4">
            {data.prevLessonId === null ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
                <ChevronLeft className="size-4" aria-hidden="true" />
                {t("prev")}
              </span>
            ) : (
              <Button asChild variant="secondary" size="sm">
                <Link href={`/learn/${courseSlug}/${data.prevLessonId}`}>
                  <ChevronLeft className="size-4" aria-hidden="true" />
                  {t("prev")}
                </Link>
              </Button>
            )}
            {data.nextLessonId === null ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
                {t("next")}
                <ChevronRight className="size-4" aria-hidden="true" />
              </span>
            ) : (
              <Button asChild size="sm">
                <Link href={`/learn/${courseSlug}/${data.nextLessonId}`}>
                  {t("next")}
                  <ChevronRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            )}
          </nav>
        </main>
      </div>
    </div>
  );
}
