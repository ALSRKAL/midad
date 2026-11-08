/**
 * Admin reports queue (P10-T04). Reviews, threads and replies are polymorphic, so the page loads the
 * reported targets in three batched queries instead of per-row lookups.
 */

import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { conflict, notFound } from "@/lib/errors";
import { averageRating } from "@/lib/review-rules";
import { db } from "@/server/db";

export const REPORT_PAGE_SIZE = 20;
export const REPORT_STATUSES = ["OPEN", "RESOLVED", "DISMISSED"] as const;
export type ReportStatusValue = (typeof REPORT_STATUSES)[number];

export type AdminReportFilters = {
  q: string;
  status: ReportStatusValue | "ALL";
  sort: "createdAt" | "status";
  dir: "asc" | "desc";
  page: number;
};

export type AdminReportRow = {
  id: string;
  targetType: "REVIEW" | "THREAD" | "REPLY";
  targetId: string;
  targetLabel: string;
  reason: string;
  details: string | null;
  status: ReportStatusValue;
  createdAt: Date;
  reporterName: string;
  reporterEmail: string;
  resolvedByName: string | null;
  resolvedAt: Date | null;
};

const SELECT = {
  id: true,
  targetType: true,
  targetId: true,
  reason: true,
  details: true,
  status: true,
  createdAt: true,
  resolvedAt: true,
  reporter: { select: { name: true, email: true } },
  resolvedBy: { select: { name: true } },
} as const;

type Row = Prisma.ReportGetPayload<{ select: typeof SELECT }>;

async function labelsFor(rows: Row[]): Promise<Map<string, string>> {
  const ids = (type: Row["targetType"]) =>
    rows.filter((row) => row.targetType === type).map((row) => row.targetId);
  const [reviews, threads, replies] = await Promise.all([
    ids("REVIEW").length === 0
      ? []
      : db.review.findMany({
          where: { id: { in: ids("REVIEW") } },
          select: { id: true, body: true, rating: true },
        }),
    ids("THREAD").length === 0
      ? []
      : db.thread.findMany({
          where: { id: { in: ids("THREAD") } },
          select: { id: true, title: true },
        }),
    ids("REPLY").length === 0
      ? []
      : db.reply.findMany({
          where: { id: { in: ids("REPLY") } },
          select: { id: true, body: true },
        }),
  ]);
  const labels = new Map<string, string>();
  for (const review of reviews) {
    labels.set(review.id, review.body === null ? `${review.rating}/5` : review.body.slice(0, 160));
  }
  for (const thread of threads) labels.set(thread.id, thread.title);
  for (const reply of replies) labels.set(reply.id, reply.body.slice(0, 160));
  return labels;
}

function mapRow(row: Row, labels: Map<string, string>): AdminReportRow {
  return {
    id: row.id,
    targetType: row.targetType,
    targetId: row.targetId,
    targetLabel: labels.get(row.targetId) ?? row.targetId,
    reason: row.reason,
    details: row.details,
    status: row.status,
    createdAt: row.createdAt,
    reporterName: row.reporter.name,
    reporterEmail: row.reporter.email,
    resolvedByName: row.resolvedBy?.name ?? null,
    resolvedAt: row.resolvedAt,
  };
}

function buildWhere(filters: AdminReportFilters): Prisma.ReportWhereInput {
  const where: Prisma.ReportWhereInput = {};
  if (filters.status !== "ALL") where.status = filters.status;
  const q = filters.q.trim();
  if (q !== "") {
    where.OR = [
      { reason: { contains: q, mode: "insensitive" } },
      { details: { contains: q, mode: "insensitive" } },
      { reporter: { name: { contains: q, mode: "insensitive" } } },
      { reporter: { email: { contains: q, mode: "insensitive" } } },
    ];
  }
  return where;
}

export async function listAdminReports(filters: AdminReportFilters): Promise<{
  rows: AdminReportRow[];
  total: number;
  page: number;
  pageCount: number;
}> {
  const where = buildWhere(filters);
  const total = await db.report.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / REPORT_PAGE_SIZE));
  const page = Math.min(Math.max(filters.page, 1), pageCount);
  const rows = await db.report.findMany({
    where,
    orderBy: [{ [filters.sort]: filters.dir }, { id: "asc" }],
    skip: (page - 1) * REPORT_PAGE_SIZE,
    take: REPORT_PAGE_SIZE,
    select: SELECT,
  });
  const labels = await labelsFor(rows);
  return { rows: rows.map((row) => mapRow(row, labels)), total, page, pageCount };
}

export async function exportAdminReports(filters: AdminReportFilters): Promise<AdminReportRow[]> {
  const rows = await db.report.findMany({
    where: buildWhere(filters),
    orderBy: [{ [filters.sort]: filters.dir }, { id: "asc" }],
    take: 10_000,
    select: SELECT,
  });
  const labels = await labelsFor(rows);
  return rows.map((row) => mapRow(row, labels));
}

export function parseAdminReportFilters(raw: Record<string, string>): AdminReportFilters {
  const status = raw.status as ReportStatusValue | undefined;
  return {
    q: typeof raw.q === "string" ? raw.q.slice(0, 200) : "",
    status: status !== undefined && REPORT_STATUSES.includes(status) ? status : "ALL",
    sort: raw.sort === "status" ? "status" : "createdAt",
    dir: raw.dir === "asc" ? "asc" : "desc",
    page: Math.max(1, Number(raw.page ?? "1") || 1),
  };
}

async function hideTarget(
  tx: Prisma.TransactionClient,
  targetType: Row["targetType"],
  targetId: string,
): Promise<void> {
  if (targetType === "REVIEW") {
    const review = await tx.review.update({
      where: { id: targetId },
      data: { isHidden: true },
      select: { courseId: true },
    });
    const reviews = await tx.review.findMany({
      where: { courseId: review.courseId, isHidden: false },
      select: { rating: true },
    });
    const aggregate = averageRating(reviews.map((item) => item.rating));
    await tx.course.update({
      where: { id: review.courseId },
      data: { ratingAvg: aggregate.averageX100, ratingCount: aggregate.count },
    });
    return;
  }
  if (targetType === "THREAD") {
    await tx.thread.update({ where: { id: targetId }, data: { isHidden: true } });
    return;
  }
  await tx.reply.update({ where: { id: targetId }, data: { isHidden: true } });
}

export async function decideReport(input: {
  adminId: string;
  reportId: string;
  decision: "RESOLVED" | "DISMISSED";
  hide: boolean;
}): Promise<void> {
  const report = await db.report.findUnique({
    where: { id: input.reportId },
    select: { id: true, status: true, targetType: true, targetId: true },
  });
  if (report === null) throw notFound("Report not found");
  if (report.status !== "OPEN") throw conflict("REPORT_ALREADY_DECIDED");

  await db.$transaction(async (tx) => {
    const updated = await tx.report.updateMany({
      where: { id: report.id, status: "OPEN" },
      data: {
        status: input.decision,
        resolvedById: input.adminId,
        resolvedAt: new Date(),
      },
    });
    if (updated.count === 0) throw conflict("REPORT_ALREADY_DECIDED");
    if (input.hide && input.decision === "RESOLVED") {
      await hideTarget(tx, report.targetType, report.targetId);
    }
    await tx.auditLog.create({
      data: {
        actorId: input.adminId,
        action: `${input.decision === "RESOLVED" ? "report.resolved" : "report.dismissed"}`,
        entity: "Report",
        entityId: report.id,
        before: { status: "OPEN" },
        after: {
          status: input.decision,
          hidden: input.hide && input.decision === "RESOLVED",
          targetType: report.targetType,
          targetId: report.targetId,
        },
      },
    });
  });
}
