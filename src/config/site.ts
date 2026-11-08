/**
 * Single source of truth for platform branding and static configuration.
 * Changing the brand here must be enough to rename the platform everywhere
 * (the product requirements) — no literal brand string is allowed anywhere else in the code base.
 */

export const locales = ["ar", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ar";

/**
 * Application roles. This is the client-safe source of truth; the Prisma enum in
 * prisma/schema.prisma must stay in sync (verified by the seed's role distribution and by P02's
 * RBAC tests). Importing the generated Prisma enum here would pull server code into the client.
 */
export const roles = ["STUDENT", "INSTRUCTOR", "ADMIN"] as const;
export type Role = (typeof roles)[number];

export const currencies = ["SAR", "USD"] as const;
export type Currency = (typeof currencies)[number];

export const defaultCurrency: Currency = "SAR";

/** Currency minor-unit exponents. Both supported currencies use 2 decimals (halala / cent). */
export const currencyFractionDigits: Record<Currency, number> = {
  SAR: 2,
  USD: 2,
};

/** BCP-47 tags used for Intl formatting; Arabic uses Latin digits for clarity (ADR-0008). */
export const intlLocales: Record<Locale, string> = {
  ar: "ar-SA-u-nu-latn",
  en: "en-US",
};

export const htmlLang: Record<Locale, string> = {
  ar: "ar",
  en: "en",
};

export const direction: Record<Locale, "rtl" | "ltr"> = {
  ar: "rtl",
  en: "ltr",
};

export const siteConfig = {
  /** Internal identifier, used by the seed, mail templates and PDFs. */
  key: "midad",
  name: {
    ar: "مِداد",
    en: "Midad",
  },
  /** Short tagline used in metadata titles. */
  tagline: {
    ar: "تعلّم عملي بالعربية، بشهادات موثّقة",
    en: "Practical learning in Arabic, with verifiable certificates",
  },
  /** Canonical URL used for metadata, sitemap and og:url. Overridden by NEXT_PUBLIC_SITE_URL. */
  url: "http://localhost:3000",
  /** Public support address shown on the contact page and in transactional email footers. */
  supportEmail: "support@midad.example",
  /** Default Open Graph image path (generated dynamically for courses in P11-T01). */
  ogImagePath: "/opengraph-image",
  /** Certificate verification code format, e.g. MD-7K3P-9QX2 (BR-17). */
  certificateCodePrefix: "MD",
  /** Default platform settings seeded into PlatformSetting; editable by an admin later. */
  defaultPlatformSettings: {
    commissionBps: 7000, // BR-11: 70%
    vatBps: 1500, // BR-06: 15%
    refundWindowDays: 14, // BR-10
    refundMaxProgressPct: 30, // BR-10
    payoutMinimumMinor: 10_000, // BR-13: 100 SAR in halalas
    quizPassPct: 70, // BR-16
    quizMaxAttempts: 3, // BR-16
    reviewMinProgressPct: 20, // BR-18
    signedUrlTtlSec: 900, // BR-20: 15 minutes
    maintenanceMode: false,
  },
} as const;

export type SiteConfig = typeof siteConfig;
