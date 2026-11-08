/**
 * Instructor applications queue (P05-T03).
 *
 * Approving creates the instructor profile and promotes the account in one transaction; rejecting
 * records the reason the applicant reads. Both notify in-app and by email.
 */

import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { env } from "@/env";
import { conflict } from "@/lib/errors";
import { db } from "@/server/db";
import { logger } from "@/server/logger";
import { enqueueEmail } from "@/server/email-queue";

export const APPLICATION_PAGE_SIZE = 20;
export const APPLICATION_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type ApplicationStatusValue = (typeof APPLICATION_STATUSES)[number];

export type AdminApplicationFilters = {
  q: string;
  status: ApplicationStatusValue | "ALL";
  sort: "createdAt" | "status" | "field";
  dir: "asc" | "desc";
  page: number;
};

export type AdminApplicationRow = {
  id: string;
  applicantName: string;
  applicantEmail: string;
  field: string;
  experience: string;
  status: ApplicationStatusValue;
  createdAt: Date;
  portfolioUrl: string | null;
  sampleVideoUrl: string | null;
  reason: string | null;
};

const SELECT = {
  id: true,
  field: true,
  experience: true,
  status: true,
  createdAt: true,
  portfolioUrl: true,
  sampleVideoUrl: true,
  reason: true,
  user: { select: { name: true, email: true } },
} as const;

type Row = Prisma.InstructorApplicationGetPayload<{ select: typeof SELECT }>;

function mapRow(row: Row): AdminApplicationRow {
  return {
    id: row.id,
    applicantName: row.user.name,
    applicantEmail: row.user.email,
    field: row.field,
    experience: row.experience,
    status: row.status,
    createdAt: row.createdAt,
    portfolioUrl: row.portfolioUrl,
    sampleVideoUrl: row.sampleVideoUrl,
    reason: row.reason,
  };
}

function buildWhere(filters: AdminApplicationFilters): Prisma.InstructorApplicationWhereInput {
  const where: Prisma.InstructorApplicationWhereInput = {};
  if (filters.status !== "ALL") where.status = filters.status;
  const q = filters.q.trim();
  if (q !== "") {
    where.OR = [
      { field: { contains: q, mode: "insensitive" } },
      { experience: { contains: q, mode: "insensitive" } },
      { user: { name: { contains: q, mode: "insensitive" } } },
      { user: { email: { contains: q, mode: "insensitive" } } },
    ];
  }
  return where;
}

export async function listAdminApplications(filters: AdminApplicationFilters): Promise<{
  rows: AdminApplicationRow[];
  total: number;
  page: number;
  pageCount: number;
}> {
  const where = buildWhere(filters);
  const total = await db.instructorApplication.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / APPLICATION_PAGE_SIZE));
  const page = Math.min(Math.max(filters.page, 1), pageCount);

  const rows = await db.instructorApplication.findMany({
    where,
    orderBy: [{ [filters.sort]: filters.dir }, { id: "asc" }],
    skip: (page - 1) * APPLICATION_PAGE_SIZE,
    take: APPLICATION_PAGE_SIZE,
    select: SELECT,
  });

  return { rows: rows.map(mapRow), total, page, pageCount };
}

export async function exportAdminApplications(
  filters: AdminApplicationFilters,
): Promise<AdminApplicationRow[]> {
  const rows = await db.instructorApplication.findMany({
    where: buildWhere(filters),
    orderBy: [{ [filters.sort]: filters.dir }, { id: "asc" }],
    take: 10_000,
    select: SELECT,
  });
  return rows.map(mapRow);
}

export function parseAdminApplicationFilters(
  raw: Record<string, string | string[] | undefined>,
): AdminApplicationFilters {
  const scalar = (key: string): string | undefined => {
    const value = raw[key];
    return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
  };

  const statusRaw = scalar("status");
  const status: ApplicationStatusValue | "ALL" =
    statusRaw === "ALL"
      ? "ALL"
      : APPLICATION_STATUSES.includes(statusRaw as ApplicationStatusValue)
        ? (statusRaw as ApplicationStatusValue)
        : "PENDING";

  const sortRaw = scalar("sort");
  const sort = sortRaw === "status" || sortRaw === "field" ? sortRaw : "createdAt";
  const dir = scalar("dir") === "desc" ? "desc" : "asc";
  const pageRaw = Number(scalar("page") ?? "1");
  const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  return { q: scalar("q") ?? "", status, sort, dir, page };
}

export type ApplicationDetail = AdminApplicationRow & {
  applicantUserId: string;
  applicantLocale: "AR" | "EN";
  applicantRole: "STUDENT" | "INSTRUCTOR" | "ADMIN";
  reviewedAt: Date | null;
  reviewerName: string | null;
};

export async function getApplicationDetail(id: string): Promise<ApplicationDetail | null> {
  const row = await db.instructorApplication.findUnique({
    where: { id },
    select: {
      ...SELECT,
      reviewedAt: true,
      user: { select: { id: true, name: true, email: true, locale: true, role: true } },
      reviewedBy: { select: { name: true } },
    },
  });
  if (row === null) return null;

  return {
    ...mapRow(row),
    applicantUserId: row.user.id,
    applicantLocale: row.user.locale,
    applicantRole: row.user.role,
    reviewedAt: row.reviewedAt,
    reviewerName: row.reviewedBy?.name ?? null,
  };
}

function notificationCopy(
  locale: "AR" | "EN",
  approved: boolean,
  reason?: string,
): { title: string; body: string } {
  if (approved) {
    return locale === "EN"
      ? {
          title: "You are now an instructor",
          body: "Your application was approved. The instructor dashboard is now available to you.",
        }
      : {
          title: "أصبحت مدربًا في مِداد",
          body: "تمت الموافقة على طلبك، ولوحة المدرب متاحة لك الآن.",
        };
  }
  return locale === "EN"
    ? {
        title: "Update on your instructor application",
        body:
          reason === undefined
            ? "Your application was reviewed and was not approved this time."
            : `Your application was reviewed and was not approved this time: ${reason}`,
      }
    : {
        title: "تحديث بشأن طلب التدريب",
        body:
          reason === undefined
            ? "راجعنا طلبك ولم تتم الموافقة عليه هذه المرة."
            : `راجعنا طلبك ولم تتم الموافقة عليه هذه المرة: ${reason}`,
      };
}

async function sendApplicationEmail(
  email: string,
  name: string,
  localeValue: "AR" | "EN",
  approved: boolean,
  reason: string | undefined,
): Promise<void> {
  try {
    const locale = localeValue === "EN" ? "en" : "ar";
    await enqueueEmail({
      to: email,
      template: "instructor_application_decision",
      locale,
      data: {
        name,
        approved,
        reason: reason ?? null,
        url: `${env.APP_URL.replace(/\/$/, "")}/${locale}/instructor`,
      },
    });
  } catch (error) {
    logger.error({ err: error, email }, "instructor application email enqueue failed");
  }
}

export async function approveApplication(adminId: string, applicationId: string): Promise<void> {
  const application = await getApplicationDetail(applicationId);
  if (application === null) throw conflict("APPLICATION_NOT_FOUND");
  if (application.status !== "PENDING") throw conflict("APPLICATION_ALREADY_DECIDED");
  if (application.applicantRole !== "STUDENT") throw conflict("APPLICANT_ROLE_CONFLICT");

  const now = new Date();
  await db.$transaction(async (tx) => {
    const pending = await tx.instructorApplication.findFirst({
      where: { id: applicationId, status: "PENDING" },
      select: { id: true },
    });
    if (pending === null) throw conflict("APPLICATION_ALREADY_DECIDED");

    await tx.instructorApplication.update({
      where: { id: applicationId },
      data: { status: "APPROVED", reviewedById: adminId, reviewedAt: now, reason: null },
    });
    await tx.instructorProfile.upsert({
      where: { userId: application.applicantUserId },
      create: { userId: application.applicantUserId, approvedAt: now, headline: application.field },
      update: { approvedAt: now },
    });
    await tx.user.update({
      where: { id: application.applicantUserId },
      data: { role: "INSTRUCTOR" },
    });
    await tx.auditLog.create({
      data: {
        actorId: adminId,
        action: "instructorApplication.approved",
        entity: "InstructorApplication",
        entityId: applicationId,
      },
    });
    const copy = notificationCopy(application.applicantLocale, true);
    await tx.notification.create({
      data: {
        userId: application.applicantUserId,
        type: "INSTRUCTOR_APPLICATION_DECISION",
        title: copy.title,
        body: copy.body,
        linkPath: "/instructor",
      },
    });
  });

  await sendApplicationEmail(
    application.applicantEmail,
    application.applicantName,
    application.applicantLocale,
    true,
    undefined,
  );
}

export async function rejectApplication(
  adminId: string,
  applicationId: string,
  reason: string,
): Promise<void> {
  const application = await getApplicationDetail(applicationId);
  if (application === null) throw conflict("APPLICATION_NOT_FOUND");
  if (application.status !== "PENDING") throw conflict("APPLICATION_ALREADY_DECIDED");
  const cleanReason = reason.trim();
  if (cleanReason.length < 10) throw conflict("REASON_TOO_SHORT");

  const now = new Date();
  await db.$transaction(async (tx) => {
    const pending = await tx.instructorApplication.findFirst({
      where: { id: applicationId, status: "PENDING" },
      select: { id: true },
    });
    if (pending === null) throw conflict("APPLICATION_ALREADY_DECIDED");

    await tx.instructorApplication.update({
      where: { id: applicationId },
      data: {
        status: "REJECTED",
        reviewedById: adminId,
        reviewedAt: now,
        reason: cleanReason,
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: adminId,
        action: "instructorApplication.rejected",
        entity: "InstructorApplication",
        entityId: applicationId,
        after: { reason: cleanReason },
      },
    });
    const copy = notificationCopy(application.applicantLocale, false, cleanReason);
    await tx.notification.create({
      data: {
        userId: application.applicantUserId,
        type: "INSTRUCTOR_APPLICATION_DECISION",
        title: copy.title,
        body: copy.body,
        linkPath: "/teach",
      },
    });
  });

  await sendApplicationEmail(
    application.applicantEmail,
    application.applicantName,
    application.applicantLocale,
    false,
    cleanReason,
  );
}
