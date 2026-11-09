"use client";

import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** Instructor navigation. Only destinations that exist are listed (the product requirements). */
export function InstructorNav() {
  const t = useTranslations("InstructorDashboard");
  const pathname = usePathname();

  const items = [
    { href: "/instructor", label: t("navOverview"), exact: true },
    { href: "/instructor/courses", label: t("navCourses"), exact: false },
    { href: "/instructor/coupons", label: t("navCoupons"), exact: false },
    { href: "/instructor/earnings", label: t("navEarnings"), exact: false },
    { href: "/instructor/announcements", label: t("navAnnouncements"), exact: false },
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
