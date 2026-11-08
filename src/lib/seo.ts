import type { Metadata } from "next";

import type { Locale } from "@/config/site";

/**
 * Canonical + hreflang metadata (P11-T01).
 *
 * Public pages pass their locale-agnostic path (for example `/courses`) and receive the canonical
 * URL for the current locale plus `ar`, `en` and `x-default` alternates. Query strings (filters,
 * pagination) are intentionally not part of the canonical URL; the catalog keeps its canonical
 * short by omitting default filters (see `catalog-filters.ts`).
 */
export function seoAlternates(locale: Locale, path: string): Metadata["alternates"] {
  const normalised = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  return {
    canonical: `/${locale}${normalised}`,
    languages: {
      ar: `/ar${normalised}`,
      en: `/en${normalised}`,
      "x-default": `/ar${normalised}`,
    },
  };
}

export function openGraphFor(input: {
  locale: Locale;
  title: string;
  description: string;
  path: string;
}): Metadata["openGraph"] {
  return {
    type: "website",
    siteName: "Midad",
    locale: input.locale === "ar" ? "ar_SA" : "en_US",
    alternateLocale: input.locale === "ar" ? "en_US" : "ar_SA",
    title: input.title,
    description: input.description,
    url: `/${input.locale}${input.path === "/" ? "" : input.path}`,
  };
}
