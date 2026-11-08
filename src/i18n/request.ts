import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import type englishMessages from "../../messages/en.json";

import { routing } from "./routing";

/**
 * Loads the message catalogue for the active locale.
 *
 * The catalogue is imported dynamically so only the requested language ships to the browser, and an
 * unknown locale falls back to Arabic rather than throwing (a typo in a URL must not 500).
 *
 * The message shape comes from the English catalogue as a type-only import (erased at build, so the
 * other language is never bundled), which makes a key added to one language and not the other a
 * compile error as well as an `i18n:check` failure.
 */
export type Messages = typeof englishMessages;

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  const catalogue = (await import(`../../messages/${locale}.json`)) as { default: Messages };

  return {
    locale,
    messages: catalogue.default,
    formats: {
      dateTime: {
        short: { day: "numeric", month: "short", year: "numeric" },
        long: { day: "numeric", month: "long", year: "numeric" },
      },
    },
    timeZone: "Asia/Riyadh",
    now: new Date(),
  };
});
