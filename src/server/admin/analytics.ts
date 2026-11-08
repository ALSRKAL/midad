import "server-only";

import type { AnalyticsRange } from "@/lib/analytics-range";
import { db } from "@/server/db";

/** Platform analytics (P10-T04): gross order revenue net of completed refunds, plus new accounts. */

export type AdminAnalyticsPoint = {
  date: string;
  revenueCents: number;
  newUsers: number;
};

export type AdminAnalytics = {
  range: AnalyticsRange;
  revenueCents: number;
  newUsers: number;
  series: AdminAnalyticsPoint[];
};

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function getAdminAnalytics(range: AnalyticsRange): Promise<AdminAnalytics> {
  const now = new Date();
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (range - 1)),
  );

  const [orders, refunds, users] = await Promise.all([
    db.order.findMany({
      where: {
        paidAt: { gte: start },
        currency: "SAR",
        status: { in: ["PAID", "REFUNDED", "PARTIALLY_REFUNDED"] },
      },
      select: { paidAt: true, totalCents: true },
    }),
    db.refund.findMany({
      where: {
        status: "COMPLETED",
        decidedAt: { gte: start },
        order: { currency: "SAR" },
      },
      select: { decidedAt: true, amountCents: true },
    }),
    db.user.findMany({
      where: { createdAt: { gte: start } },
      select: { createdAt: true },
    }),
  ]);

  const revenueByDay = new Map<string, number>();
  for (const order of orders) {
    if (order.paidAt === null) continue;
    const key = dayKey(order.paidAt);
    revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + order.totalCents);
  }
  for (const refund of refunds) {
    if (refund.decidedAt === null) continue;
    const key = dayKey(refund.decidedAt);
    revenueByDay.set(key, (revenueByDay.get(key) ?? 0) - refund.amountCents);
  }
  const usersByDay = new Map<string, number>();
  for (const user of users) {
    const key = dayKey(user.createdAt);
    usersByDay.set(key, (usersByDay.get(key) ?? 0) + 1);
  }

  const series: AdminAnalyticsPoint[] = [];
  for (let offset = 0; offset < range; offset += 1) {
    const key = dayKey(new Date(start.getTime() + offset * 86_400_000));
    series.push({
      date: key,
      revenueCents: revenueByDay.get(key) ?? 0,
      newUsers: usersByDay.get(key) ?? 0,
    });
  }

  return {
    range,
    revenueCents: series.reduce((sum, point) => sum + point.revenueCents, 0),
    newUsers: users.length,
    series,
  };
}
