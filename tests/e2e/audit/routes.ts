/**
 * Central route lists for the interaction and mobile accessibility audits (the product requirements, P14-T02).
 * Both audits must cover the same set of pages; keeping one list prevents drift.
 */

export const AUDIT_ROLES = {
  guest: {
    email: null,
    paths: [
      "/",
      "/courses",
      "/courses/modern-react-app-development",
      "/categories/programming",
      "/instructors/noor-almutairi",
      "/about",
      "/faq",
      "/contact",
      "/terms",
      "/privacy",
      "/teach",
    ],
  },
  student: {
    email: "student.demo@midad.test",
    paths: [
      "/dashboard",
      "/purchases",
      "/wishlist",
      "/settings",
      "/notifications",
      "/cart",
      "/courses/modern-react-app-development",
    ],
  },
  instructor: {
    email: "instructor.demo@midad.test",
    paths: [
      "/instructor",
      "/instructor/courses",
      "/instructor/coupons",
      "/instructor/announcements",
      "/instructor/earnings",
    ],
  },
  admin: {
    email: "admin@midad.test",
    paths: [
      "/admin",
      "/admin/users",
      "/admin/courses",
      "/admin/applications",
      "/admin/categories",
      "/admin/coupons",
      "/admin/audit",
      "/admin/orders",
      "/admin/refunds",
      "/admin/payouts",
      "/admin/reports",
      "/admin/messages",
      "/admin/settings",
    ],
  },
} as const;

export type AuditRole = keyof typeof AUDIT_ROLES;
