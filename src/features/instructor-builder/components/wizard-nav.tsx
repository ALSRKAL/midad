"use client";

import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** Steps inside one course. Pricing joins the list when P04-T06 builds its page. */
export function WizardNav({ courseId }: { courseId: string }) {
  const t = useTranslations("CourseBuilder");
  const pathname = usePathname();

  const steps = [
    { href: `/instructor/courses/${courseId}/edit`, label: t("navBasics"), match: "/edit" },
    {
      href: `/instructor/courses/${courseId}/curriculum`,
      label: t("navCurriculum"),
      match: "/curriculum",
    },
    {
      href: `/instructor/courses/${courseId}/publish`,
      label: t("navPricing"),
      match: "/publish",
    },
  ];

  return (
    <nav aria-label={t("navLabel")} className="flex flex-wrap gap-1 border-b border-border">
      {steps.map((step) => {
        const active = pathname === step.href || pathname.startsWith(`${step.href}/`);
        return (
          <Link
            key={step.href}
            href={step.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {step.label}
          </Link>
        );
      })}
    </nav>
  );
}
