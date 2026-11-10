import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { AttachmentsPanel } from "@/features/instructor-builder/components/attachments-panel";
import { QuizEditor } from "@/features/instructor-builder/components/quiz-editor";
import { TextLessonEditor } from "@/features/instructor-builder/components/text-lesson-editor";
import { VideoUploader } from "@/features/instructor-builder/components/video-uploader";
import { Link } from "@/i18n/navigation";
import { richTextPlainLength } from "@/lib/sanitize-rich-text";
import { getOwnedLesson } from "@/server/curriculum";
import { findOwnedCourse, getInstructorProfileId } from "@/server/instructor-courses";
import { getLessonQuiz, getLessonText, listAttachments } from "@/server/lesson-content";
import { getCurrentSession } from "@/server/session";

/** Lesson management (P04-T04 upload, P04-T05 text, quiz and attachments). */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Video" });
  return { title: t("title") };
}

export default async function LessonEditorPage({
  params,
}: {
  params: Promise<{ locale: string; id: string; lessonId: string }>;
}) {
  const { locale, id, lessonId } = await params;
  setRequestLocale(locale);

  const user = await getCurrentSession();
  if (user === null) return null;

  const instructorId = await getInstructorProfileId(user.id);
  if (instructorId === null) notFound();

  const course = await findOwnedCourse(instructorId, id);
  if (course === null) notFound();

  const lesson = await getOwnedLesson(instructorId, id, lessonId);
  if (lesson === null) notFound();

  const [t, videoT, curriculumT, contentT] = await Promise.all([
    getTranslations({ locale, namespace: "CourseBuilder" }),
    getTranslations({ locale, namespace: "Video" }),
    getTranslations({ locale, namespace: "Curriculum" }),
    getTranslations({ locale, namespace: "LessonContent" }),
  ]);

  const [text, quiz, attachments] = await Promise.all([
    lesson.type === "TEXT" ? getLessonText(instructorId, id, lessonId) : Promise.resolve(null),
    lesson.type === "QUIZ" ? getLessonQuiz(instructorId, id, lessonId) : Promise.resolve(null),
    listAttachments(instructorId, id, lessonId),
  ]);

  const title = locale === "en" ? lesson.titleEn : lesson.titleAr;
  const sectionTitle = locale === "en" ? lesson.sectionTitleEn : lesson.sectionTitleAr;
  const typeLabel =
    lesson.type === "VIDEO"
      ? curriculumT("typeVideo")
      : lesson.type === "QUIZ"
        ? curriculumT("typeQuiz")
        : lesson.type === "FILE"
          ? curriculumT("typeFile")
          : curriculumT("typeText");

  return (
    <section aria-labelledby="lesson-editor-title">
      <Link
        href={`/instructor/courses/${course.id}/curriculum`}
        className="text-sm font-medium text-primary hover:underline"
      >
        {t("navCurriculum")}
      </Link>

      <p className="mt-3 text-sm text-muted-foreground">{sectionTitle}</p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <h3 id="lesson-editor-title" className="font-heading text-xl font-semibold text-foreground">
          {title}
        </h3>
        <span className="rounded-sm border border-border-strong px-2 py-0.5 text-xs text-muted-foreground">
          {typeLabel}
        </span>
      </div>

      <div className="mt-5 space-y-6">
        {lesson.type === "VIDEO" && (
          <div className="rounded-md border border-border bg-surface p-5">
            <h4 className="font-heading text-lg font-semibold text-foreground">
              {videoT("title")}
            </h4>
            <p className="mt-1 text-sm text-muted-foreground">{videoT("subtitle")}</p>
            <div className="mt-4">
              <VideoUploader
                courseId={course.id}
                lessonId={lesson.id}
                initial={{
                  status: lesson.video?.status ?? null,
                  durationSec: lesson.video?.durationSec ?? 0,
                  errorMessage: lesson.video?.errorMessage ?? null,
                  canResume: lesson.video?.status === "UPLOADING",
                }}
              />
            </div>
          </div>
        )}

        {lesson.type === "TEXT" && text !== null && (
          <div className="rounded-md border border-border bg-surface p-5">
            <h4 className="font-heading text-lg font-semibold text-foreground">
              {contentT("textTitle")}
            </h4>
            <p className="mt-1 text-sm text-muted-foreground">{contentT("textSubtitle")}</p>
            <div className="mt-4">
              <TextLessonEditor
                courseId={course.id}
                lessonId={lesson.id}
                initial={text}
                initialLengths={{
                  ar: richTextPlainLength(text.contentAr),
                  en: richTextPlainLength(text.contentEn),
                }}
              />
            </div>
          </div>
        )}

        {lesson.type === "QUIZ" && quiz !== null && (
          <div className="rounded-md border border-border bg-surface p-5">
            <h4 className="font-heading text-lg font-semibold text-foreground">
              {contentT("quizTitle")}
            </h4>
            <p className="mt-1 text-sm text-muted-foreground">{contentT("quizSubtitle")}</p>
            <div className="mt-5">
              <QuizEditor courseId={course.id} lessonId={lesson.id} quiz={quiz} />
            </div>
          </div>
        )}

        {lesson.type === "FILE" && (
          <div className="rounded-md border border-border bg-surface p-5">
            <h4 className="font-heading text-lg font-semibold text-foreground">
              {videoT("fileLessonTitle")}
            </h4>
            <p className="mt-1 text-sm text-muted-foreground">{videoT("fileLessonBody")}</p>
          </div>
        )}

        <div className="rounded-md border border-border bg-surface p-5">
          <AttachmentsPanel
            courseId={course.id}
            lessonId={lesson.id}
            initial={attachments.map((attachment) => ({
              id: attachment.id,
              title: attachment.title,
              mimeType: attachment.mimeType,
              sizeBytes: attachment.sizeBytes,
              createdAt: attachment.createdAt.toISOString(),
            }))}
          />
        </div>
      </div>
    </section>
  );
}
