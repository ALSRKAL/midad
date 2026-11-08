/**
 * Wishlist (the product requirements, P03-T05).
 *
 * One row per (user, course), enforced by the unique constraint. Only published courses can be
 * added or listed: saving an archived course would create a link to a page that no longer sells.
 */

import "server-only";

import { notFound } from "@/lib/errors";
import type { CatalogCourse } from "@/server/catalog";
import { CATALOG_COURSE_SELECT, mapCatalogCourse } from "@/server/catalog";
import { db } from "@/server/db";

export async function isCourseWishlisted(userId: string, courseId: string): Promise<boolean> {
  const row = await db.wishlist.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { id: true },
  });
  return row !== null;
}

export async function listWishlist(userId: string): Promise<CatalogCourse[]> {
  const rows = await db.wishlist.findMany({
    where: { userId, course: { status: "PUBLISHED" } },
    orderBy: { createdAt: "desc" },
    select: {
      course: { select: CATALOG_COURSE_SELECT },
    },
  });
  return rows.map((row) => mapCatalogCourse(row.course));
}

export async function toggleWishlist(
  userId: string,
  courseId: string,
): Promise<{ wishlisted: boolean }> {
  const course = await db.course.findFirst({
    where: { id: courseId, status: "PUBLISHED" },
    select: { id: true },
  });
  if (course === null) throw notFound("Course not found");

  const existing = await db.wishlist.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { id: true },
  });

  if (existing === null) {
    await db.wishlist.create({ data: { userId, courseId } });
    return { wishlisted: true };
  }

  await db.wishlist.delete({ where: { id: existing.id } });
  return { wishlisted: false };
}
