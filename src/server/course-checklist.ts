/**
 * BR-02 submission checklist (P04-T06).
 *
 * Computed on the server from the current rows, never trusted from the client and never cached: the
 * submit action recomputes it, so a course whose last video is still processing cannot be submitted
 * by crafting a request.
 *
 * The prompt's rule is literal for video and text lessons. FILE lessons require at least one
 * attachment and QUIZ lessons at least one question; a lesson with no content of its type cannot be
 * taught, so it is treated as unfinished.
 */

import "server-only";

import { richTextPlainLength } from "@/lib/sanitize-rich-text";
import type { CourseStatus } from "@/lib/course-state";
import { notFound } from "@/lib/errors";
import { db } from "@/server/db";

export type ChecklistKey = "basics" | "cover" | "objectives" | "sections" | "lessons" | "price";

export type ChecklistItem = {
  key: ChecklistKey;
  passed: boolean;
  /** For "lessons": how many lessons still need work. */
  incompleteLessons: number;
};

export type CourseChecklist = {
  status: CourseStatus;
  items: ChecklistItem[];
  ready: boolean;
};

export async function getCourseChecklist(
  instructorId: string,
  courseId: string,
): Promise<CourseChecklist> {
  const course = await db.course.findFirst({
    where: { id: courseId, instructorId },
    select: {
      status: true,
      titleAr: true,
      titleEn: true,
      descriptionAr: true,
      descriptionEn: true,
      coverImageKey: true,
      isFree: true,
      priceCents: true,
      objectives: { select: { id: true } },
      sections: {
        select: {
          id: true,
          lessons: {
            select: {
              id: true,
              type: true,
              contentAr: true,
              contentEn: true,
              videoAsset: { select: { status: true } },
              attachments: { select: { id: true } },
              quiz: { select: { _count: { select: { questions: true } } } },
            },
          },
        },
      },
    },
  });
  if (course === null) throw notFound("Course not found");

  const title = (course.titleAr ?? "").trim() !== "" || (course.titleEn ?? "").trim() !== "";
  const description =
    (course.descriptionAr ?? "").trim() !== "" || (course.descriptionEn ?? "").trim() !== "";

  const incompleteLessons = course.sections
    .flatMap((section) => section.lessons)
    .filter((lesson) => {
      if (lesson.type === "VIDEO") return lesson.videoAsset?.status !== "READY";
      if (lesson.type === "TEXT") {
        return (
          richTextPlainLength(lesson.contentAr ?? "") < 200 &&
          richTextPlainLength(lesson.contentEn ?? "") < 200
        );
      }
      if (lesson.type === "FILE") return lesson.attachments.length === 0;
      return (lesson.quiz?._count.questions ?? 0) === 0;
    }).length;

  const items: ChecklistItem[] = [
    { key: "basics", passed: title && description, incompleteLessons: 0 },
    { key: "cover", passed: course.coverImageKey !== null, incompleteLessons: 0 },
    { key: "objectives", passed: course.objectives.length >= 3, incompleteLessons: 0 },
    {
      key: "sections",
      passed: course.sections.some((section) => section.lessons.length >= 5),
      incompleteLessons: 0,
    },
    { key: "lessons", passed: incompleteLessons === 0, incompleteLessons },
    { key: "price", passed: course.isFree || course.priceCents > 0, incompleteLessons: 0 },
  ];

  return {
    status: course.status,
    items,
    ready: items.every((item) => item.passed),
  };
}
