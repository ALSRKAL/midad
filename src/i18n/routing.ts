/**
 * Locale routing contract (next-intl v4).
 *
 * Arabic is the default and is always prefixed (`/ar/...`), so a URL never changes meaning based on
 * a cookie and every page has one canonical address per language — the product requirements.
 */

import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ar", "en"],
  defaultLocale: "ar",
  localePrefix: "always",
  // The middleware remembers the last choice in a cookie, which is the second step of the locale
  // precedence chain in the product requirements (saved user preference → cookie → Accept-Language → Arabic).
  localeCookie: {
    name: "MIDAD_LOCALE",
    maxAge: 60 * 60 * 24 * 365,
  },
  localeDetection: true,
});

export type AppLocale = (typeof routing.locales)[number];
