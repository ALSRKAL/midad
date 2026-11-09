"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown,
  ChevronUp,
  FileText,
  GripVertical,
  HelpCircle,
  PlayCircle,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Link } from "@/i18n/navigation";
import {
  addLessonAction,
  addSectionAction,
  deleteLessonAction,
  deleteSectionAction,
  moveLessonAction,
  renameSectionAction,
  reorderLessonsAction,
  reorderSectionsAction,
  setLessonPreviewAction,
} from "@/features/instructor-builder/actions";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatDuration } from "@/lib/dates";
import type { BuilderLesson, BuilderLessonType, BuilderSection } from "@/server/curriculum";

/**
 * Curriculum editor (P04-T03).
 *
 * Ordering has three equivalent paths: pointer drag, touch drag and keyboard drag (dnd-kit sensors
 * with Space/arrows), plus explicit up/down buttons for people who prefer them. All of them call
 * the same server action, and a failed call restores the previous order rather than leaving the
 * screen disagreeing with the database.
 *
 * Lessons move between sections with a select; the server appends them to the target section.
 */

function titleOf(section: { titleAr: string; titleEn: string }, isEn: boolean): string {
  return isEn ? section.titleEn : section.titleAr;
}

function LessonIcon({ type }: { type: BuilderLessonType }) {
  if (type === "VIDEO") return <PlayCircle className="size-4" aria-hidden="true" />;
  if (type === "QUIZ") return <HelpCircle className="size-4" aria-hidden="true" />;
  return <FileText className="size-4" aria-hidden="true" />;
}

export function CurriculumEditor({
  courseId,
  initialSections,
}: {
  courseId: string;
  initialSections: BuilderSection[];
}) {
  const t = useTranslations("Curriculum");
  const isEn = useLocale() === "en";

  const [sections, setSections] = useState(initialSections);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function persistSectionOrder(next: BuilderSection[], previous: BuilderSection[]) {
    setSections(next);
    const result = await reorderSectionsAction({
      courseId,
      orderedIds: next.map((section) => section.id),
    });
    if (!result.ok) {
      setSections(previous);
      setError(t("orderFailed"));
    }
  }

  function onSectionDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over === null || active.id === over.id) return;
    const previous = sections;
    const oldIndex = sections.findIndex((section) => section.id === active.id);
    const newIndex = sections.findIndex((section) => section.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    void persistSectionOrder(arrayMove(sections, oldIndex, newIndex), previous);
  }

  function moveSection(sectionId: string, direction: -1 | 1) {
    const index = sections.findIndex((section) => section.id === sectionId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= sections.length) return;
    void persistSectionOrder(arrayMove(sections, index, target), sections);
  }

  async function addSection(titleAr: string, titleEn: string): Promise<boolean> {
    const result = await addSectionAction({ courseId, titleAr, titleEn });
    if (!result.ok) {
      setError(
        result.error.message.includes("SECTION_TITLE_REQUIRED")
          ? t("sectionTitleRequired")
          : t("genericError"),
      );
      return false;
    }
    setSections((current) => [
      ...current,
      {
        id: result.value.id,
        titleAr: titleAr === "" ? titleEn : titleAr,
        titleEn: titleEn === "" ? titleAr : titleEn,
        lessons: [],
      },
    ]);
    setError(null);
    return true;
  }

  async function renameSection(
    sectionId: string,
    titleAr: string,
    titleEn: string,
  ): Promise<boolean> {
    const result = await renameSectionAction({ courseId, sectionId, titleAr, titleEn });
    if (!result.ok) {
      setError(
        result.error.message.includes("SECTION_TITLE_REQUIRED")
          ? t("sectionTitleRequired")
          : t("genericError"),
      );
      return false;
    }
    setSections((current) =>
      current.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              titleAr: titleAr === "" ? titleEn : titleAr,
              titleEn: titleEn === "" ? titleAr : titleEn,
            }
          : section,
      ),
    );
    setError(null);
    return true;
  }

  async function deleteSection(sectionId: string): Promise<boolean> {
    const previous = sections;
    setSections((current) => current.filter((section) => section.id !== sectionId));
    const result = await deleteSectionAction({ courseId, sectionId });
    if (!result.ok) {
      setSections(previous);
      setError(t("genericError"));
      return false;
    }
    setError(null);
    return true;
  }

  async function addLesson(
    sectionId: string,
    type: BuilderLessonType,
    titleAr: string,
    titleEn: string,
  ): Promise<boolean> {
    const result = await addLessonAction({ courseId, sectionId, type, titleAr, titleEn });
    if (!result.ok) {
      setError(
        result.error.message.includes("LESSON_TITLE_REQUIRED")
          ? t("lessonTitleRequired")
          : t("genericError"),
      );
      return false;
    }

    const lesson: BuilderLesson = {
      id: result.value.id,
      type,
      titleAr: titleAr === "" ? titleEn : titleAr,
      titleEn: titleEn === "" ? titleAr : titleEn,
      durationSec: 0,
      isPreview: false,
      isPublished: true,
      videoStatus: null,
      quizId: null,
    };
    setSections((current) =>
      current.map((section) =>
        section.id === sectionId ? { ...section, lessons: [...section.lessons, lesson] } : section,
      ),
    );
    setError(null);
    return true;
  }

  async function persistLessonOrder(
    sectionId: string,
    nextLessons: BuilderLesson[],
    previous: BuilderSection[],
  ): Promise<boolean> {
    setSections((current) =>
      current.map((section) =>
        section.id === sectionId ? { ...section, lessons: nextLessons } : section,
      ),
    );
    const result = await reorderLessonsAction({
      courseId,
      sectionId,
      orderedIds: nextLessons.map((lesson) => lesson.id),
    });
    if (!result.ok) {
      setSections(previous);
      setError(t("orderFailed"));
      return false;
    }
    setError(null);
    return true;
  }

  async function deleteLesson(sectionId: string, lessonId: string): Promise<boolean> {
    const previous = sections;
    setSections((current) =>
      current.map((section) =>
        section.id === sectionId
          ? { ...section, lessons: section.lessons.filter((lesson) => lesson.id !== lessonId) }
          : section,
      ),
    );
    const result = await deleteLessonAction({ courseId, lessonId });
    if (!result.ok) {
      setSections(previous);
      setError(t("genericError"));
      return false;
    }
    setError(null);
    return true;
  }

  async function moveLesson(
    lessonId: string,
    fromSectionId: string,
    toSectionId: string,
  ): Promise<boolean> {
    const previous = sections;
    const lesson = previous
      .find((section) => section.id === fromSectionId)
      ?.lessons.find((item) => item.id === lessonId);
    if (lesson === undefined) return false;

    setSections((current) =>
      current.map((section) => {
        if (section.id === fromSectionId) {
          return {
            ...section,
            lessons: section.lessons.filter((item) => item.id !== lessonId),
          };
        }
        if (section.id === toSectionId) {
          return { ...section, lessons: [...section.lessons, lesson] };
        }
        return section;
      }),
    );

    const result = await moveLessonAction({ courseId, lessonId, targetSectionId: toSectionId });
    if (!result.ok) {
      setSections(previous);
      setError(t("moveFailed"));
      return false;
    }
    setError(null);
    return true;
  }

  async function togglePreview(lessonId: string, isPreview: boolean): Promise<void> {
    const previous = sections;
    setSections((current) =>
      current.map((section) => ({
        ...section,
        lessons: section.lessons.map((lesson) =>
          lesson.id === lessonId ? { ...lesson, isPreview } : lesson,
        ),
      })),
    );
    const result = await setLessonPreviewAction({ courseId, lessonId, isPreview });
    if (!result.ok) {
      setSections(previous);
      setError(t("genericError"));
    }
  }

  return (
    <div className="space-y-5">
      {error !== null && (
        <p role="alert" className="rounded-sm border border-danger px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {sections.length === 0 ? (
        <div className="rounded-md border border-border bg-surface p-6 text-center">
          <h3 className="font-heading text-lg font-semibold text-foreground">{t("emptyTitle")}</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{t("emptyBody")}</p>
        </div>
      ) : (
        <DndContext
          id="sections"
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onSectionDragEnd}
        >
          <SortableContext
            items={sections.map((section) => section.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="space-y-4">
              {sections.map((section, index) => (
                <SortableSection
                  key={section.id}
                  section={section}
                  sections={sections}
                  isEn={isEn}
                  index={index}
                  courseId={courseId}
                  onMoveSection={moveSection}
                  onRenameSection={renameSection}
                  onDeleteSection={deleteSection}
                  onAddLesson={addLesson}
                  onReorderLessons={persistLessonOrder}
                  onDeleteLesson={deleteLesson}
                  onMoveLesson={moveLesson}
                  onTogglePreview={togglePreview}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <AddSectionForm onAdd={addSection} />
    </div>
  );
}

function SortableSection({
  section,
  sections,
  isEn,
  index,
  courseId,
  onMoveSection,
  onRenameSection,
  onDeleteSection,
  onAddLesson,
  onReorderLessons,
  onDeleteLesson,
  onMoveLesson,
  onTogglePreview,
}: {
  section: BuilderSection;
  sections: BuilderSection[];
  isEn: boolean;
  index: number;
  courseId: string;
  onMoveSection: (sectionId: string, direction: -1 | 1) => void;
  onRenameSection: (sectionId: string, titleAr: string, titleEn: string) => Promise<boolean>;
  onDeleteSection: (sectionId: string) => Promise<boolean>;
  onAddLesson: (
    sectionId: string,
    type: BuilderLessonType,
    titleAr: string,
    titleEn: string,
  ) => Promise<boolean>;
  onReorderLessons: (
    sectionId: string,
    nextLessons: BuilderLesson[],
    previous: BuilderSection[],
  ) => Promise<boolean>;
  onDeleteLesson: (sectionId: string, lessonId: string) => Promise<boolean>;
  onMoveLesson: (lessonId: string, fromSectionId: string, toSectionId: string) => Promise<boolean>;
  onTogglePreview: (lessonId: string, isPreview: boolean) => Promise<void>;
}) {
  const t = useTranslations("Curriculum");
  const [renaming, setRenaming] = useState(false);
  const [titleAr, setTitleAr] = useState(section.titleAr);
  const [titleEn, setTitleEn] = useState(section.titleEn);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };
  const title = titleOf(section, isEn);

  return (
    <li ref={setNodeRef} style={style}>
      <section className="rounded-md border border-border bg-surface">
        <header className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <button
            type="button"
            {...attributes}
            {...listeners}
            aria-label={t("dragHandle", { title })}
            className="cursor-grab rounded-sm p-1.5 text-muted-foreground hover:bg-muted active:cursor-grabbing"
          >
            <GripVertical className="size-4" aria-hidden="true" />
          </button>

          <div className="min-w-0 flex-1">
            <h3 className="font-heading text-lg font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground">
              {t("sectionLessons", { count: section.lessons.length })}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t("moveUp", { title })}
              disabled={index === 0}
              onClick={() => onMoveSection(section.id, -1)}
            >
              <ChevronUp aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t("moveDown", { title })}
              disabled={index === sections.length - 1}
              onClick={() => onMoveSection(section.id, 1)}
            >
              <ChevronDown aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setTitleAr(section.titleAr);
                setTitleEn(section.titleEn);
                setRenaming((current) => !current);
              }}
            >
              {t("renameSection")}
            </Button>
            <ConfirmDialog
              triggerLabel={t("deleteSection")}
              title={t("deleteSectionTitle")}
              description={t("deleteSectionBody", { title, count: section.lessons.length })}
              confirmLabel={t("deleteSectionConfirm")}
              cancelLabel={t("cancel")}
              errorLabel={t("genericError")}
              onConfirm={() => onDeleteSection(section.id)}
            />
          </div>
        </header>

        {renaming && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void onRenameSection(section.id, titleAr, titleEn).then((ok) => {
                if (ok) setRenaming(false);
              });
            }}
            className="grid gap-3 border-b border-border p-3 sm:grid-cols-[1fr_1fr_auto]"
          >
            <div className="space-y-1">
              <Label htmlFor={`section-ar-${section.id}`}>{t("sectionTitleAr")}</Label>
              <Input
                id={`section-ar-${section.id}`}
                dir="rtl"
                value={titleAr}
                maxLength={120}
                onChange={(event) => setTitleAr(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`section-en-${section.id}`}>{t("sectionTitleEn")}</Label>
              <Input
                id={`section-en-${section.id}`}
                dir="ltr"
                value={titleEn}
                maxLength={120}
                onChange={(event) => setTitleEn(event.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit" size="sm">
                {t("saveSection")}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setRenaming(false)}>
                {t("cancel")}
              </Button>
            </div>
          </form>
        )}

        <div className="p-3">
          {section.lessons.length > 0 && (
            <LessonList
              key="lesson-list"
              section={section}
              sections={sections}
              isEn={isEn}
              courseId={courseId}
              onReorderLessons={onReorderLessons}
              onDeleteLesson={onDeleteLesson}
              onMoveLesson={onMoveLesson}
              onTogglePreview={onTogglePreview}
            />
          )}
          <AddLessonForm key="add-lesson" sectionId={section.id} onAdd={onAddLesson} />
        </div>
      </section>
    </li>
  );
}

function LessonList({
  section,
  sections,
  isEn,
  courseId,
  onReorderLessons,
  onDeleteLesson,
  onMoveLesson,
  onTogglePreview,
}: {
  section: BuilderSection;
  sections: BuilderSection[];
  isEn: boolean;
  courseId: string;
  onReorderLessons: (
    sectionId: string,
    nextLessons: BuilderLesson[],
    previous: BuilderSection[],
  ) => Promise<boolean>;
  onDeleteLesson: (sectionId: string, lessonId: string) => Promise<boolean>;
  onMoveLesson: (lessonId: string, fromSectionId: string, toSectionId: string) => Promise<boolean>;
  onTogglePreview: (lessonId: string, isPreview: boolean) => Promise<void>;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over === null || active.id === over.id) return;
    const previous = sections;
    const oldIndex = section.lessons.findIndex((lesson) => lesson.id === active.id);
    const newIndex = section.lessons.findIndex((lesson) => lesson.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    void onReorderLessons(section.id, arrayMove(section.lessons, oldIndex, newIndex), previous);
  }

  function moveLesson(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= section.lessons.length) return;
    void onReorderLessons(section.id, arrayMove(section.lessons, index, target), sections);
  }

  return (
    <DndContext
      id={`lessons-${section.id}`}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={section.lessons.map((lesson) => lesson.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="divide-y divide-border rounded-sm border border-border">
          {section.lessons.map((lesson, index) => (
            <SortableLesson
              key={lesson.id}
              lesson={lesson}
              sectionId={section.id}
              sections={sections}
              isEn={isEn}
              courseId={courseId}
              index={index}
              lastIndex={section.lessons.length - 1}
              onMove={moveLesson}
              onDeleteLesson={onDeleteLesson}
              onMoveLesson={onMoveLesson}
              onTogglePreview={onTogglePreview}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableLesson({
  lesson,
  sectionId,
  sections,
  isEn,
  courseId,
  index,
  lastIndex,
  onMove,
  onDeleteLesson,
  onMoveLesson,
  onTogglePreview,
}: {
  lesson: BuilderLesson;
  sectionId: string;
  sections: BuilderSection[];
  isEn: boolean;
  courseId: string;
  index: number;
  lastIndex: number;
  onMove: (index: number, direction: -1 | 1) => void;
  onDeleteLesson: (sectionId: string, lessonId: string) => Promise<boolean>;
  onMoveLesson: (lessonId: string, fromSectionId: string, toSectionId: string) => Promise<boolean>;
  onTogglePreview: (lessonId: string, isPreview: boolean) => Promise<void>;
}) {
  const t = useTranslations("Curriculum");
  const videoT = useTranslations("Video");
  const [moveTarget, setMoveTarget] = useState("");

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lesson.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };
  const title = isEn ? lesson.titleEn : lesson.titleAr;
  const typeLabel =
    lesson.type === "VIDEO"
      ? t("typeVideo")
      : lesson.type === "QUIZ"
        ? t("typeQuiz")
        : lesson.type === "FILE"
          ? t("typeFile")
          : t("typeText");

  return (
    <li ref={setNodeRef} style={style} className="bg-surface">
      <div className="flex flex-wrap items-center gap-2 p-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={t("dragHandle", { title })}
          className="cursor-grab rounded-sm p-1.5 text-muted-foreground hover:bg-muted active:cursor-grabbing"
        >
          <GripVertical className="size-4" aria-hidden="true" />
        </button>

        <LessonIcon type={lesson.type} />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">
            {typeLabel}
            {lesson.durationSec > 0 ? ` · ${formatDuration(lesson.durationSec)}` : ""}
            {lesson.type === "VIDEO" && lesson.videoStatus !== null
              ? ` · ${
                  lesson.videoStatus === "READY"
                    ? videoT("videoStatusReady")
                    : lesson.videoStatus === "PROCESSING"
                      ? videoT("videoStatusProcessing")
                      : lesson.videoStatus === "UPLOADING"
                        ? videoT("videoStatusUploading")
                        : videoT("videoStatusFailed")
                }`
              : ""}
          </p>
        </div>

        <Link
          href={`/instructor/courses/${courseId}/curriculum/${lesson.id}`}
          className="text-xs font-medium text-primary hover:underline"
        >
          {videoT("manageLesson")}
        </Link>

        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{t("previewLabel")}</span>
          <Switch
            aria-label={`${t("previewLabel")}: ${title}`}
            checked={lesson.isPreview}
            onCheckedChange={(checked) => {
              void onTogglePreview(lesson.id, checked);
            }}
          />
        </label>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t("moveUp", { title })}
            disabled={index === 0}
            onClick={() => onMove(index, -1)}
          >
            <ChevronUp aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t("moveDown", { title })}
            disabled={index === lastIndex}
            onClick={() => onMove(index, 1)}
          >
            <ChevronDown aria-hidden="true" />
          </Button>
          <ConfirmDialog
            triggerLabel={t("deleteLesson")}
            title={t("deleteLessonTitle")}
            description={t("deleteLessonBody", { title })}
            confirmLabel={t("deleteLessonConfirm")}
            cancelLabel={t("cancel")}
            errorLabel={t("genericError")}
            onConfirm={() => onDeleteLesson(sectionId, lesson.id)}
          />
        </div>
      </div>

      {sections.length > 1 && (
        <div className="flex items-center gap-2 border-t border-border px-3 py-2">
          <span className="text-xs text-muted-foreground">{t("moveToSection")}</span>
          <Select
            aria-label={t("moveToSection")}
            value={moveTarget}
            containerClassName="w-auto"
            className="h-8 pe-8 text-sm"
            onChange={(event) => {
              const target = event.target.value;
              setMoveTarget(target);
              if (target !== "") {
                void onMoveLesson(lesson.id, sectionId, target).then(() => setMoveTarget(""));
              }
            }}
          >
            <option value="">—</option>
            {sections
              .filter((section) => section.id !== sectionId)
              .map((section) => (
                <option key={section.id} value={section.id}>
                  {titleOf(section, isEn)}
                </option>
              ))}
          </Select>
        </div>
      )}
    </li>
  );
}

function AddLessonForm({
  sectionId,
  onAdd,
}: {
  sectionId: string;
  onAdd: (
    sectionId: string,
    type: BuilderLessonType,
    titleAr: string,
    titleEn: string,
  ) => Promise<boolean>;
}) {
  const t = useTranslations("Curriculum");
  const [type, setType] = useState<BuilderLessonType>("VIDEO");
  const [titleAr, setTitleAr] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <details className="mt-3">
      <summary className="cursor-pointer text-sm font-medium text-primary">
        {t("addLesson")}
      </summary>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setPending(true);
          void onAdd(sectionId, type, titleAr, titleEn).then((ok) => {
            setPending(false);
            if (ok) {
              setTitleAr("");
              setTitleEn("");
            }
          });
        }}
        className="mt-3 grid gap-3 sm:grid-cols-2"
      >
        <div className="space-y-1">
          <Label htmlFor={`lesson-ar-${sectionId}`}>{t("lessonTitleAr")}</Label>
          <Input
            id={`lesson-ar-${sectionId}`}
            dir="rtl"
            value={titleAr}
            maxLength={120}
            onChange={(event) => setTitleAr(event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`lesson-en-${sectionId}`}>{t("lessonTitleEn")}</Label>
          <Input
            id={`lesson-en-${sectionId}`}
            dir="ltr"
            value={titleEn}
            maxLength={120}
            onChange={(event) => setTitleEn(event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`lesson-type-${sectionId}`}>{t("lessonType")}</Label>
          <Select
            id={`lesson-type-${sectionId}`}
            value={type}
            onChange={(event) => setType(event.target.value as BuilderLessonType)}
          >
            <option value="VIDEO">{t("typeVideo")}</option>
            <option value="TEXT">{t("typeText")}</option>
            <option value="FILE">{t("typeFile")}</option>
            <option value="QUIZ">{t("typeQuiz")}</option>
          </Select>
        </div>
        <div className="flex items-end">
          <Button type="submit" size="sm" loading={pending}>
            {pending ? t("addingLesson") : t("addLesson")}
          </Button>
        </div>
      </form>
    </details>
  );
}

function AddSectionForm({
  onAdd,
}: {
  onAdd: (titleAr: string, titleEn: string) => Promise<boolean>;
}) {
  const t = useTranslations("Curriculum");
  const [titleAr, setTitleAr] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <section className="rounded-md border border-border bg-surface p-4">
      <h3 className="font-heading text-lg font-semibold text-foreground">{t("addSectionTitle")}</h3>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setPending(true);
          void onAdd(titleAr, titleEn).then((ok) => {
            setPending(false);
            if (ok) {
              setTitleAr("");
              setTitleEn("");
            }
          });
        }}
        className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
      >
        <div className="space-y-1">
          <Label htmlFor="new-section-ar">{t("sectionTitleAr")}</Label>
          <Input
            id="new-section-ar"
            dir="rtl"
            value={titleAr}
            maxLength={120}
            onChange={(event) => setTitleAr(event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="new-section-en">{t("sectionTitleEn")}</Label>
          <Input
            id="new-section-en"
            dir="ltr"
            value={titleEn}
            maxLength={120}
            onChange={(event) => setTitleEn(event.target.value)}
          />
        </div>
        <div className="flex items-end">
          <Button type="submit" loading={pending}>
            {pending ? t("addingSection") : t("addSection")}
          </Button>
        </div>
      </form>
    </section>
  );
}
