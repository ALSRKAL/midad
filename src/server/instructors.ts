/**
 * Public instructor page data (the product requirements).
 *
 * Only instructors with an existing profile and at least the INSTRUCTOR role are public. Student
 * emails are never selected here; the page shows the profile fields the instructor owns.
 */

import "server-only";

import { cache } from "react";

import type { CatalogCourse } from "@/server/catalog";
import { CATALOG_COURSE_SELECT, mapCatalogCourse } from "@/server/catalog";
import { db } from "@/server/db";

export type InstructorPageData = {
  username: string;
  name: string;
  image: string | null;
  headline: string | null;
  bioAr: string | null;
  bioEn: string | null;
  websiteUrl: string | null;
  twitterUrl: string | null;
  linkedinUrl: string | null;
  stats: { courses: number; students: number; ratingAvg: number };
  courses: CatalogCourse[];
};

export const getInstructorPage = cache(
  async (username: string): Promise<InstructorPageData | null> => {
    const user = await db.user.findFirst({
      where: { username, role: "INSTRUCTOR", status: "ACTIVE", deletedAt: null },
      select: {
        name: true,
        image: true,
        username: true,
        instructorProfile: {
          select: {
            id: true,
            headline: true,
            bioAr: true,
            bioEn: true,
            websiteUrl: true,
            twitterUrl: true,
            linkedinUrl: true,
          },
        },
      },
    });

    const profile = user?.instructorProfile;
    if (user === null || user.username === null || profile === null || profile === undefined) {
      return null;
    }

    const [rows, aggregate] = await Promise.all([
      db.course.findMany({
        where: { instructorId: profile.id, status: "PUBLISHED" },
        orderBy: [{ studentsCount: "desc" }, { publishedAt: "desc" }],
        select: CATALOG_COURSE_SELECT,
      }),
      db.course.aggregate({
        where: { instructorId: profile.id, status: "PUBLISHED" },
        _sum: { studentsCount: true },
        _avg: { ratingAvg: true },
        _count: { _all: true },
      }),
    ]);

    return {
      username: user.username,
      name: user.name,
      image: user.image,
      headline: profile.headline,
      bioAr: profile.bioAr,
      bioEn: profile.bioEn,
      websiteUrl: profile.websiteUrl,
      twitterUrl: profile.twitterUrl,
      linkedinUrl: profile.linkedinUrl,
      stats: {
        courses: aggregate._count._all,
        students: aggregate._sum.studentsCount ?? 0,
        ratingAvg: Math.round(aggregate._avg.ratingAvg ?? 0),
      },
      courses: rows.map(mapCatalogCourse),
    };
  },
);

export type CategoryPageData = {
  slug: string;
  nameAr: string;
  nameEn: string;
  icon: string | null;
  courseCount: number;
};

export const getCategoryBySlug = cache(async (slug: string): Promise<CategoryPageData | null> => {
  const category = await db.category.findFirst({
    where: { slug, isActive: true },
    select: {
      slug: true,
      nameAr: true,
      nameEn: true,
      icon: true,
      _count: { select: { courses: { where: { status: "PUBLISHED" } } } },
    },
  });
  if (category === null) return null;

  return {
    slug: category.slug,
    nameAr: category.nameAr,
    nameEn: category.nameEn,
    icon: category.icon,
    courseCount: category._count.courses,
  };
});
