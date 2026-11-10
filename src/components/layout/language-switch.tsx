"use client";

import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";

/**
 * Language switch.
 *
 * Lives in a client component because it needs the current pathname to keep the visitor on the same
 * page (with the same query string) when the locale changes — the product requirements. The visible text stays in
 * the DOM and the extra explanation is added for screen readers, because an `aria-label` that
 * replaced the text would violate "the visible text is part of the accessible name".
 */
export function LanguageSwitch({ targetLocale }: { targetLocale: "ar" | "en" }) {
  const t = useTranslations("Locale");
  const pathname = usePathname();

  return (
    <Link
      href={pathname}
      locale={targetLocale}
      hrefLang={targetLocale}
      className="rounded-sm px-3 py-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
    >
      {t("switchTo")}
      <span className="sr-only">{` — ${t("switchLabel")}`}</span>
    </Link>
  );
}
