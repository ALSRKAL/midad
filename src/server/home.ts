/**
 * Home page data (the product requirements).
 *
 * Every number and every card comes from the database — stats are counted at request time, the two
 * course rails are ordered by real sales/recency, the instructor rail by the students their published
 * courses actually have, and the testimonials are the newest high-rated reviews with text.
 *
 * No mock content and no "featured" flag exists, because a featured flag nobody maintains is a lie.
 */

import "server-only";

import { db } from "@/server/db";
import { CATALOG_COURSE_SELECT, type CatalogCourse, mapCatalogCourse } from "@/server/catalog";

export type HomeStats = {
  publishedCourses: number;
  learners: number;
  instructors: number;
  certificates: number;
};

export type HomeCategory = {
  slug: string;
  nameAr: string;
  nameEn: string;
  icon: string | null;
  courseCount: number;
};

export type HomeInstructor = {
  username: string;
  name: string;
  headline: string | null;
  image: string | null;
  courseCount: number;
  studentsCount: number;
};

export type HomeReview = {
  id: string;
  rating: number;
  body: string;
  authorName: string;
  courseSlug: string;
  courseTitleAr: string | null;
  courseTitleEn: string | null;
  createdAt: Date;
};

export type HomeSuggestion = { slug: string; titleAr: string | null; titleEn: string | null };

export type HomeData = {
  stats: HomeStats;
  categories: HomeCategory[];
  bestSellers: CatalogCourse[];
  newest: CatalogCourse[];
  instructors: HomeInstructor[];
  reviews: HomeReview[];
  suggestions: HomeSuggestion[];
};

export async function getHomeData(): Promise<HomeData> {
  const [publishedCourses, learners, instructors, certificates, categories] = await Promise.all([
    db.course.count({ where: { status: "PUBLISHED" } }),
    db.user.count({ where: { role: "STUDENT", status: "ACTIVE", deletedAt: null } }),
    db.instructorProfile.count({ where: { approvedAt: { not: null } } }),
    db.certificate.count({ where: { status: "ISSUED" } }),
    db.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        slug: true,
        nameAr: true,
        nameEn: true,
        icon: true,
        _count: { select: { courses: { where: { status: "PUBLISHED" } } } },
      },
    }),
  ]);

  const bestSellerRows = await db.course.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ studentsCount: "desc" }, { ratingAvg: "desc" }],
    take: 4,
    select: CATALOG_COURSE_SELECT,
  });
  const bestSellerIds = bestSellerRows.map((row) => row.id);

  const newestRows = await db.course.findMany({
    where: { status: "PUBLISHED", id: { notIn: bestSellerIds } },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 4,
    select: CATALOG_COURSE_SELECT,
  });

  const instructorTotals = await db.course.groupBy({
    by: ["instructorId"],
    where: { status: "PUBLISHED" },
    _sum: { studentsCount: true },
    orderBy: { _sum: { studentsCount: "desc" } },
    take: 4,
  });

  const instructorRows = await db.instructorProfile.findMany({
    where: { id: { in: instructorTotals.map((row) => row.instructorId) } },
    select: {
      id: true,
      headline: true,
      user: { select: { name: true, image: true, username: true } },
      _count: { select: { courses: { where: { status: "PUBLISHED" } } } },
    },
  });

  const studentsByInstructor = new Map(
    instructorTotals.map((row) => [row.instructorId, row._sum.studentsCount ?? 0]),
  );
  const instructorList: HomeInstructor[] = instructorRows
    .filter((row): row is typeof row & { user: { username: string } } => row.user.username !== null)
    .map((row) => ({
      username: row.user.username,
      name: row.user.name,
      headline: row.headline,
      image: row.user.image,
      courseCount: row._count.courses,
      studentsCount: studentsByInstructor.get(row.id) ?? 0,
    }))
    .sort((a, b) => b.studentsCount - a.studentsCount);

  const reviewRows = await db.review.findMany({
    where: { isHidden: false, rating: { gte: 4 }, body: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 3,
    select: {
      id: true,
      rating: true,
      body: true,
      createdAt: true,
      user: { select: { name: true } },
      course: { select: { slug: true, titleAr: true, titleEn: true } },
    },
  });

  const suggestionRows = await db.course.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ studentsCount: "desc" }, { publishedAt: "desc" }],
    take: 20,
    select: { slug: true, titleAr: true, titleEn: true },
  });

  return {
    stats: {
      publishedCourses,
      learners,
      instructors,
      certificates,
    },
    categories: categories.map((category) => ({
      slug: category.slug,
      nameAr: category.nameAr,
      nameEn: category.nameEn,
      icon: category.icon,
      courseCount: category._count.courses,
    })),
    bestSellers: bestSellerRows.map(mapCatalogCourse),
    newest: newestRows.map(mapCatalogCourse),
    instructors: instructorList,
    reviews: reviewRows.map((review) => ({
      id: review.id,
      rating: review.rating,
      body: review.body ?? "",
      authorName: review.user.name,
      courseSlug: review.course.slug,
      courseTitleAr: review.course.titleAr,
      courseTitleEn: review.course.titleEn,
      createdAt: review.createdAt,
    })),
    suggestions: suggestionRows,
  };
}
