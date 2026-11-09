"use client";

import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** Admin navigation. Destinations appear here as their pages are built (the product requirements). */
export function AdminNav() {
  const t = useTranslations("Admin");
  const pathname = usePathname();

  const items = [
    { href: "/admin", label: t("navOverview"), exact: true },
    { href: "/admin/users", label: t("navUsers"), exact: false },
    { href: "/admin/courses", label: t("navCourses"), exact: false },
    { href: "/admin/applications", label: t("navApplications"), exact: false },
    { href: "/admin/categories", label: t("navCategories"), exact: false },
    { href: "/admin/coupons", label: t("navCoupons"), exact: false },
    { href: "/admin/refunds", label: t("navRefunds"), exact: false },
    { href: "/admin/payouts", label: t("navPayouts"), exact: false },
    { href: "/admin/orders", label: t("navOrders"), exact: false },
    { href: "/admin/reports", label: t("navReports"), exact: false },
    { href: "/admin/messages", label: t("navMessages"), exact: false },
    { href: "/admin/settings", label: t("navSettings"), exact: false },
    { href: "/admin/audit", label: t("navAudit"), exact: false },
  ];

  return (
    <nav aria-label={t("navLabel")} className="flex flex-col gap-1">
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-sm px-3 py-2 text-sm font-medium",
              active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
