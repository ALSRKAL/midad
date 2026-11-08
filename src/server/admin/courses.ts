/**
 * Admin course queue (P05-T02).
 *
 * Defaults to PENDING_REVIEW with the oldest submission first; `status=ALL` browses everything.
 * Search matches both language titles, the slug and the instructor's name.
 */

import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";

export const ADMIN_COURSE_PAGE_SIZE = 20;
export const COURSE_STATUSES = [
  "DRAFT",
  "PENDING_REVIEW",
  "PUBLISHED",
  "REJECTED",
  "UNLISTED",
  "ARCHIVED",
] as const;
export type CourseStatusValue = (typeof COURSE_STATUSES)[number];

export type AdminCourseFilters = {
  q: string;
  status: CourseStatusValue | "ALL";
  sort: "updatedAt" | "createdAt" | "priceCents" | "status";
  dir: "asc" | "desc";
  page: number;
};

export type AdminCourseRow = {
  id: string;
  slug: string;
  titleAr: string | null;
  titleEn: string | null;
  status: CourseStatusValue;
  instructorName: string;
  instructorEmail: string;
  priceCents: number;
  isFree: boolean;
  lessonCount: number;
  updatedAt: Date;
  rejectionReason: string | null;
};

function buildWhere(filters: AdminCourseFilters): Prisma.CourseWhereInput {
  const where: Prisma.CourseWhereInput = {};
  if (filters.status !== "ALL") where.status = filters.status;
  const q = filters.q.trim();
  if (q !== "") {
    where.OR = [
      { titleAr: { contains: q, mode: "insensitive" } },
      { titleEn: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
      { instructor: { user: { name: { contains: q, mode: "insensitive" } } } },
    ];
  }
  return where;
}

const SELECT = {
  id: true,
  slug: true,
  titleAr: true,
  titleEn: true,
  status: true,
  priceCents: true,
  isFree: true,
  updatedAt: true,
  rejectionReason: true,
  instructor: { select: { user: { select: { name: true, email: true } } } },
  sections: { select: { _count: { select: { lessons: true } } } },
} as const;

type Row = Prisma.CourseGetPayload<{ select: typeof SELECT }>;

function mapRow(row: Row): AdminCourseRow {
  return {
    id: row.id,
    slug: row.slug,
    titleAr: row.titleAr,
    titleEn: row.titleEn,
    status: row.status,
    instructorName: row.instructor.user.name,
    instructorEmail: row.instructor.user.email,
    priceCents: row.priceCents,
    isFree: row.isFree,
    lessonCount: row.sections.reduce((sum, section) => sum + section._count.lessons, 0),
    updatedAt: row.updatedAt,
    rejectionReason: row.rejectionReason,
  };
}

export async function listAdminCourses(filters: AdminCourseFilters): Promise<{
  rows: AdminCourseRow[];
  total: number;
  page: number;
  pageCount: number;
}> {
  const where = buildWhere(filters);
  const total = await db.course.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / ADMIN_COURSE_PAGE_SIZE));
  const page = Math.min(Math.max(filters.page, 1), pageCount);

  const rows = await db.course.findMany({
    where,
    orderBy: [{ [filters.sort]: filters.dir }, { id: "asc" }],
    skip: (page - 1) * ADMIN_COURSE_PAGE_SIZE,
    take: ADMIN_COURSE_PAGE_SIZE,
    select: SELECT,
  });

  return { rows: rows.map(mapRow), total, page, pageCount };
}

export async function exportAdminCourses(filters: AdminCourseFilters): Promise<AdminCourseRow[]> {
  const rows = await db.course.findMany({
    where: buildWhere(filters),
    orderBy: [{ [filters.sort]: filters.dir }, { id: "asc" }],
    take: 10_000,
    select: SELECT,
  });
  return rows.map(mapRow);
}

export function parseAdminCourseFilters(
  raw: Record<string, string | string[] | undefined>,
): AdminCourseFilters {
  const scalar = (key: string): string | undefined => {
    const value = raw[key];
    return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
  };

  const statusRaw = scalar("status");
  const status: CourseStatusValue | "ALL" =
    statusRaw === "ALL"
      ? "ALL"
      : COURSE_STATUSES.includes(statusRaw as CourseStatusValue)
        ? (statusRaw as CourseStatusValue)
        : "PENDING_REVIEW";

  const sortRaw = scalar("sort");
  const sort =
    sortRaw === "createdAt" || sortRaw === "priceCents" || sortRaw === "status"
      ? sortRaw
      : "updatedAt";
  const dir = scalar("dir") === "desc" ? "desc" : "asc";
  const pageRaw = Number(scalar("page") ?? "1");
  const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  return { q: scalar("q") ?? "", status, sort, dir, page };
}

export type CourseReviewData = {
  courseId: string;
  status: CourseStatusValue;
  instructorProfileId: string;
  instructorUserId: string;
  instructorName: string;
  instructorEmail: string;
  instructorLocale: "AR" | "EN";
  rejectionReason: string | null;
  notes: Array<{ id: string; note: string; createdAt: Date; adminName: string }>;
};

export async function getCourseReviewMeta(courseId: string): Promise<CourseReviewData | null> {
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      status: true,
      rejectionReason: true,
      instructorId: true,
      instructor: {
        select: {
          userId: true,
          user: { select: { name: true, email: true, locale: true } },
        },
      },
      reviewNotes: {
        orderBy: { createdAt: "desc" },
        select: { id: true, note: true, createdAt: true, admin: { select: { name: true } } },
      },
    },
  });
  if (course === null) return null;

  return {
    courseId: course.id,
    status: course.status,
    instructorProfileId: course.instructorId,
    instructorUserId: course.instructor.userId,
    instructorName: course.instructor.user.name,
    instructorEmail: course.instructor.user.email,
    instructorLocale: course.instructor.user.locale,
    rejectionReason: course.rejectionReason,
    notes: course.reviewNotes.map((note) => ({
      id: note.id,
      note: note.note,
      createdAt: note.createdAt,
      adminName: note.admin.name,
    })),
  };
}
