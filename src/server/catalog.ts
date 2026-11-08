/**
 * Catalog queries (the product requirements).
 *
 * Only PUBLISHED courses are visible: ARCHIVED must not appear in search or sale (BR-04) and
 * UNLISTED is reachable by direct link only. The Arabic-normalised columns are queried with the same
 * `normalizeText` used when they were written, so a search without hamza finds the course.
 */

import "server-only";

import { unstable_cache } from "next/cache";
import { cache } from "react";

import type { Prisma } from "@/generated/prisma/client";
import { CATALOG_PAGE_SIZE, type CatalogFilters } from "@/lib/catalog-filters";
import { normalizeText } from "@/lib/search-normalize";
import { db } from "@/server/db";

export type CatalogCourse = {
  id: string;
  slug: string;
  titleAr: string | null;
  titleEn: string | null;
  subtitleAr: string | null;
  subtitleEn: string | null;
  priceCents: number;
  isFree: boolean;
  currency: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL_LEVELS";
  language: "AR" | "EN";
  coverImageKey: string | null;
  ratingAvg: number;
  ratingCount: number;
  studentsCount: number;
  totalDurationSec: number;
  category: { slug: string; nameAr: string; nameEn: string };
  instructorName: string;
};

export type CatalogSearchResult = {
  courses: CatalogCourse[];
  total: number;
  page: number;
  pageCount: number;
};

/** One projection for every course card, so a list cannot drift from the detail-independent type. */
export const CATALOG_COURSE_SELECT = {
  id: true,
  slug: true,
  titleAr: true,
  titleEn: true,
  subtitleAr: true,
  subtitleEn: true,
  priceCents: true,
  isFree: true,
  currency: true,
  level: true,
  language: true,
  coverImageKey: true,
  ratingAvg: true,
  ratingCount: true,
  studentsCount: true,
  totalDurationSec: true,
  category: { select: { slug: true, nameAr: true, nameEn: true } },
  instructor: { select: { user: { select: { name: true } } } },
} satisfies Prisma.CourseSelect;

type CatalogCourseRow = Prisma.CourseGetPayload<{ select: typeof CATALOG_COURSE_SELECT }>;

export function mapCatalogCourse(row: CatalogCourseRow): CatalogCourse {
  return {
    id: row.id,
    slug: row.slug,
    titleAr: row.titleAr,
    titleEn: row.titleEn,
    subtitleAr: row.subtitleAr,
    subtitleEn: row.subtitleEn,
    priceCents: row.priceCents,
    isFree: row.isFree,
    currency: row.currency,
    level: row.level,
    language: row.language,
    coverImageKey: row.coverImageKey,
    ratingAvg: row.ratingAvg,
    ratingCount: row.ratingCount,
    studentsCount: row.studentsCount,
    totalDurationSec: row.totalDurationSec,
    category: row.category,
    instructorName: row.instructor.user.name,
  };
}

const SORT_ORDERS: Record<CatalogFilters["sort"], Prisma.CourseOrderByWithRelationInput[]> = {
  newest: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  popular: [{ studentsCount: "desc" }, { ratingAvg: "desc" }, { publishedAt: "desc" }],
  rating: [{ ratingAvg: "desc" }, { ratingCount: "desc" }, { publishedAt: "desc" }],
  "price-asc": [{ priceCents: "asc" }, { publishedAt: "desc" }],
  "price-desc": [{ priceCents: "desc" }, { publishedAt: "desc" }],
};

export function buildCatalogWhere(filters: CatalogFilters): Prisma.CourseWhereInput {
  const conditions: Prisma.CourseWhereInput[] = [{ status: "PUBLISHED" }];

  const query = filters.q === undefined ? "" : normalizeText(filters.q);
  if (query !== "") {
    conditions.push({
      OR: [
        { titleNormalized: { contains: query } },
        { descriptionNormalized: { contains: query } },
      ],
    });
  }

  if (filters.category !== undefined) {
    conditions.push({ category: { slug: filters.category } });
  }
  if (filters.level !== undefined) {
    conditions.push(
      filters.level === "ALL_LEVELS"
        ? { level: "ALL_LEVELS" }
        : { level: { in: [filters.level, "ALL_LEVELS"] } },
    );
  }
  if (filters.price !== undefined) {
    conditions.push({ isFree: filters.price === "free" });
  }
  if (filters.rating !== undefined) {
    conditions.push({ ratingAvg: { gte: filters.rating * 100 } });
  }
  if (filters.duration === "short") {
    conditions.push({ totalDurationSec: { lt: 3600 } });
  } else if (filters.duration === "medium") {
    conditions.push({ totalDurationSec: { gte: 3600, lte: 10_800 } });
  } else if (filters.duration === "long") {
    conditions.push({ totalDurationSec: { gt: 10_800 } });
  }
  if (filters.language !== undefined) {
    conditions.push({ language: filters.language });
  }

  return { AND: conditions };
}

export async function searchCatalog(filters: CatalogFilters): Promise<CatalogSearchResult> {
  const where = buildCatalogWhere(filters);
  const total = await db.course.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE));
  const page = Math.min(Math.max(filters.page, 1), pageCount);

  const rows = await db.course.findMany({
    where,
    orderBy: SORT_ORDERS[filters.sort],
    skip: (page - 1) * CATALOG_PAGE_SIZE,
    take: CATALOG_PAGE_SIZE,
    select: CATALOG_COURSE_SELECT,
  });

  return {
    courses: rows.map(mapCatalogCourse),
    total,
    page,
    pageCount,
  };
}

export type CatalogCategory = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  icon: string | null;
};

export const listCatalogCategories = unstable_cache(
  async (): Promise<CatalogCategory[]> =>
    db.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, slug: true, nameAr: true, nameEn: true, icon: true },
    }),
  ["catalog-categories"],
  { revalidate: 300, tags: ["catalog-categories"] },
);

/* -------------------------------------------------------------------------- */
/* Course detail (P03-T03)                                                     */
/* -------------------------------------------------------------------------- */

export type CoursePageData = {
  id: string;
  slug: string;
  titleAr: string | null;
  titleEn: string | null;
  subtitleAr: string | null;
  subtitleEn: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL_LEVELS";
  language: "AR" | "EN";
  priceCents: number;
  isFree: boolean;
  currency: string;
  status: "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "REJECTED" | "UNLISTED" | "ARCHIVED";
  coverImageKey: string | null;
  promoVideoKey: string | null;
  ratingAvg: number;
  ratingCount: number;
  studentsCount: number;
  totalDurationSec: number;
  updatedAt: Date;
  category: { slug: string; nameAr: string; nameEn: string };
  instructor: {
    headline: string | null;
    bioAr: string | null;
    bioEn: string | null;
    user: { name: string; image: string | null; username: string | null; id: string };
  };
  objectives: Array<{ id: string; textAr: string; textEn: string }>;
  requirements: Array<{ id: string; textAr: string; textEn: string }>;
  sections: Array<{
    id: string;
    titleAr: string;
    titleEn: string;
    lessons: Array<{
      id: string;
      type: "VIDEO" | "TEXT" | "FILE" | "QUIZ";
      titleAr: string;
      titleEn: string;
      durationSec: number;
      isPreview: boolean;
    }>;
  }>;
  reviews: Array<{
    id: string;
    rating: number;
    body: string | null;
    createdAt: Date;
    instructorReply: string | null;
    authorId: string;
    authorName: string;
  }>;
  ratingDistribution: Record<1 | 2 | 3 | 4 | 5, number>;
};

async function loadCoursePage(where: Prisma.CourseWhereInput): Promise<CoursePageData | null> {
  const course = await db.course.findFirst({
    where,
    select: {
      id: true,
      slug: true,
      titleAr: true,
      titleEn: true,
      subtitleAr: true,
      subtitleEn: true,
      descriptionAr: true,
      descriptionEn: true,
      level: true,
      language: true,
      priceCents: true,
      isFree: true,
      currency: true,
      status: true,
      coverImageKey: true,
      promoVideoKey: true,
      ratingAvg: true,
      ratingCount: true,
      studentsCount: true,
      totalDurationSec: true,
      updatedAt: true,
      category: { select: { slug: true, nameAr: true, nameEn: true } },
      instructor: {
        select: {
          headline: true,
          bioAr: true,
          bioEn: true,
          user: { select: { name: true, image: true, username: true, id: true } },
        },
      },
      objectives: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, textAr: true, textEn: true },
      },
      requirements: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, textAr: true, textEn: true },
      },
      sections: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          titleAr: true,
          titleEn: true,
          lessons: {
            where: { isPublished: true },
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              type: true,
              titleAr: true,
              titleEn: true,
              durationSec: true,
              isPreview: true,
            },
          },
        },
      },
      reviews: {
        where: { isHidden: false },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          rating: true,
          body: true,
          createdAt: true,
          instructorReply: true,
          user: { select: { name: true, id: true } },
        },
      },
    },
  });

  if (course === null) return null;

  const groups = await db.review.groupBy({
    by: ["rating"],
    where: { courseId: course.id, isHidden: false },
    _count: { _all: true },
  });

  const ratingDistribution: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const group of groups) {
    const rating = group.rating as 1 | 2 | 3 | 4 | 5;
    if (rating >= 1 && rating <= 5) ratingDistribution[rating] = group._count._all;
  }

  return {
    ...course,
    ratingDistribution,
    reviews: course.reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      body: review.body,
      createdAt: review.createdAt,
      instructorReply: review.instructorReply,
      authorId: review.user.id,
      authorName: review.user.name,
    })),
  };
}

/** Request-scoped cache: metadata and the page body both need the same course row. */
export const getCoursePage = cache(async (slug: string): Promise<CoursePageData | null> =>
  // Archived courses are not sold or listed, but BR-04 keeps existing learners' access alive, so
  // the detail page must remain reachable by direct link.
  loadCoursePage({ slug, status: { in: ["PUBLISHED", "UNLISTED", "ARCHIVED"] } }),
);

/** Any status, but only for the instructor who owns it (used by the builder preview, P04-T06). */
export async function getCourseDetailById(
  instructorId: string,
  courseId: string,
): Promise<CoursePageData | null> {
  return loadCoursePage({ id: courseId, instructorId });
}

/** Any status, admin review only (P05-T02). Authorization happens in the admin route/action. */
export async function getCourseDetailForReview(courseId: string): Promise<CoursePageData | null> {
  return loadCoursePage({ id: courseId });
}

/** Same category, published, not the course being viewed. Used by the "similar courses" strip. */
export async function getSimilarCourses(
  courseId: string,
  categorySlug: string,
  take = 3,
): Promise<CatalogCourse[]> {
  const rows = await db.course.findMany({
    where: { category: { slug: categorySlug }, id: { not: courseId }, status: "PUBLISHED" },
    orderBy: [{ ratingAvg: "desc" }, { studentsCount: "desc" }],
    take,
    select: CATALOG_COURSE_SELECT,
  });

  return rows.map(mapCatalogCourse);
}
