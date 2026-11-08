import "server-only";

import type { AnalyticsRange } from "@/lib/analytics-range";
import { db } from "@/server/db";

/**
 * Instructor analytics (P10-T01).
 *
 * The range is always 7, 30 or 90 whole UTC days ending today. Revenue is the signed ledger total
 * (sales minus refunds) for this instructor; no mutable balance column is consulted (BR-12). New
 * students are distinct learners who enrolled in one of the instructor's courses on that day.
 */

export type AnalyticsPoint = {
  date: string;
  revenueCents: number;
  newStudents: number;
};

export type InstructorAnalytics = {
  range: AnalyticsRange;
  revenueCents: number;
  newStudents: number;
  averageRatingX100: number;
  ratingCount: number;
  completionPct: number;
  series: AnalyticsPoint[];
};

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function getInstructorAnalytics(
  instructorProfileId: string,
  range: AnalyticsRange,
): Promise<InstructorAnalytics> {
  const now = new Date();
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (range - 1)),
  );

  const [ledger, enrollments, ratings, activeEnrollments, completedEnrollments] = await Promise.all(
    [
      db.ledgerEntry.findMany({
        where: {
          instructorProfileId,
          createdAt: { gte: start },
          // The dashboard reports SAR; a future multi-currency total needs per-currency series.
          currency: "SAR",
          type: { in: ["SALE", "REFUND"] },
        },
        select: { amountCents: true, createdAt: true },
      }),
      db.enrollment.findMany({
        where: { course: { instructorId: instructorProfileId }, createdAt: { gte: start } },
        select: { userId: true, createdAt: true },
      }),
      db.review.aggregate({
        where: { course: { instructorId: instructorProfileId }, isHidden: false },
        _avg: { rating: true },
        _count: { _all: true },
      }),
      db.enrollment.count({
        where: { course: { instructorId: instructorProfileId }, status: "ACTIVE" },
      }),
      db.enrollment.count({
        where: {
          course: { instructorId: instructorProfileId },
          status: "ACTIVE",
          progressPct: 100,
        },
      }),
    ],
  );

  const revenueByDay = new Map<string, number>();
  for (const entry of ledger) {
    const key = dayKey(entry.createdAt);
    revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + entry.amountCents);
  }

  const studentsByDay = new Map<string, Set<string>>();
  for (const enrollment of enrollments) {
    const key = dayKey(enrollment.createdAt);
    const bucket = studentsByDay.get(key) ?? new Set<string>();
    bucket.add(enrollment.userId);
    studentsByDay.set(key, bucket);
  }

  const series: AnalyticsPoint[] = [];
  for (let offset = 0; offset < range; offset += 1) {
    const date = new Date(start.getTime() + offset * 86_400_000);
    const key = dayKey(date);
    series.push({
      date: key,
      revenueCents: revenueByDay.get(key) ?? 0,
      newStudents: studentsByDay.get(key)?.size ?? 0,
    });
  }

  const newStudentsInRange = new Set(enrollments.map((enrollment) => enrollment.userId)).size;

  return {
    range,
    revenueCents: series.reduce((sum, point) => sum + point.revenueCents, 0),
    newStudents: newStudentsInRange,
    averageRatingX100: Math.round((ratings._avg.rating ?? 0) * 100),
    ratingCount: ratings._count._all,
    completionPct:
      activeEnrollments === 0 ? 0 : Math.round((completedEnrollments / activeEnrollments) * 100),
    series,
  };
}
