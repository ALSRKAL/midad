import { notFound, redirect } from "next/navigation";

import { db } from "@/server/db";

/**
 * Course entry point: resolves the first lesson (or first free preview) and hands over to the player.
 * Keeps "Go to course" a single stable link even when the curriculum is reordered.
 */
export default async function LearnCourseEntry({
  params,
}: {
  params: Promise<{ locale: string; courseSlug: string }>;
}) {
  const { locale, courseSlug } = await params;
  const course = await db.course.findUnique({
    where: { slug: courseSlug },
    select: {
      sections: {
        orderBy: { sortOrder: "asc" },
        take: 1,
        select: {
          lessons: { orderBy: { sortOrder: "asc" }, take: 1, select: { id: true } },
        },
      },
    },
  });
  const lessonId = course?.sections[0]?.lessons[0]?.id;
  if (lessonId === undefined) notFound();
  redirect(`/${locale}/learn/${courseSlug}/${lessonId}`);
}
