/**
 * Admin dashboard queries (the product requirements, P05-T01).
 *
 * Every KPI is counted from the tables at request time. No number is cached, seeded into a settings
 * row or maintained by hand, so the dashboard cannot drift from the data it claims to summarise.
 */

import "server-only";

import { db } from "@/server/db";

export type AdminOverview = {
  users: { total: number; students: number; instructors: number; admins: number; banned: number };
  courses: {
    total: number;
    published: number;
    pendingReview: number;
    draft: number;
    rejected: number;
  };
  activeEnrollments: number;
  revenueCents: number;
  certificates: number;
  pendingApplications: number;
  pendingRefunds: number;
  pendingPayouts: number;
  openReports: number;
  newContactMessages: number;
};

export async function getAdminOverview(): Promise<AdminOverview> {
  const [
    usersByRole,
    bannedUsers,
    coursesByStatus,
    activeEnrollments,
    revenue,
    certificates,
    pendingApplications,
    pendingRefunds,
    pendingPayouts,
    openReports,
    newContactMessages,
  ] = await Promise.all([
    db.user.groupBy({ by: ["role"], _count: { _all: true } }),
    db.user.count({ where: { status: "BANNED" } }),
    db.course.groupBy({ by: ["status"], _count: { _all: true } }),
    db.enrollment.count({ where: { status: "ACTIVE" } }),
    db.order.aggregate({
      where: { status: "PAID", currency: "SAR" },
      _sum: { totalCents: true },
    }),
    db.certificate.count({ where: { status: "ISSUED" } }),
    db.instructorApplication.count({ where: { status: "PENDING" } }),
    db.refund.count({ where: { status: "REQUESTED" } }),
    db.payout.count({ where: { status: { in: ["REQUESTED", "APPROVED"] } } }),
    db.report.count({ where: { status: "OPEN" } }),
    db.contactMessage.count({ where: { status: "NEW" } }),
  ]);

  const roleCount = (role: "STUDENT" | "INSTRUCTOR" | "ADMIN") =>
    usersByRole.find((row) => row.role === role)?._count._all ?? 0;
  const statusCount = (status: "PUBLISHED" | "PENDING_REVIEW" | "DRAFT" | "REJECTED") =>
    coursesByStatus.find((row) => row.status === status)?._count._all ?? 0;

  return {
    users: {
      total: usersByRole.reduce((sum, row) => sum + row._count._all, 0),
      students: roleCount("STUDENT"),
      instructors: roleCount("INSTRUCTOR"),
      admins: roleCount("ADMIN"),
      banned: bannedUsers,
    },
    courses: {
      total: coursesByStatus.reduce((sum, row) => sum + row._count._all, 0),
      published: statusCount("PUBLISHED"),
      pendingReview: statusCount("PENDING_REVIEW"),
      draft: statusCount("DRAFT"),
      rejected: statusCount("REJECTED"),
    },
    activeEnrollments,
    revenueCents: revenue._sum.totalCents ?? 0,
    certificates,
    pendingApplications,
    pendingRefunds,
    pendingPayouts,
    openReports,
    newContactMessages,
  };
}
