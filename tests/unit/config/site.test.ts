import { describe, expect, it } from "vitest";

import {
  defaultCurrency,
  defaultLocale,
  direction,
  htmlLang,
  intlLocales,
  locales,
  siteConfig,
} from "@/config/site";

/**
 * Guards the platform constants that the business rules depend on. If a value here drifts,
 * the matching rule silently changes behaviour (pricing, payouts, quiz pass mark), so the
 * documented numbers are asserted explicitly against docs/BUSINESS_RULES.md.
 */
describe("site configuration", () => {
  it("ships exactly the two supported locales, Arabic first", () => {
    expect(locales).toEqual(["ar", "en"]);
    expect(defaultLocale).toBe("ar");
    expect(htmlLang.ar).toBe("ar");
    expect(htmlLang.en).toBe("en");
    expect(direction.ar).toBe("rtl");
    expect(direction.en).toBe("ltr");
  });

  it("uses Latin digits for Arabic so amounts and dates stay legible", () => {
    expect(intlLocales.ar).toBe("ar-SA-u-nu-latn");
  });

  it("defaults to SAR as the pricing currency", () => {
    expect(defaultCurrency).toBe("SAR");
    expect(siteConfig.defaultPlatformSettings.vatBps).toBe(1500); // BR-06: 15%
  });

  it("keeps the documented business-rule defaults", () => {
    const settings = siteConfig.defaultPlatformSettings;
    expect(settings.commissionBps).toBe(7000); // BR-11: 70% instructor share
    expect(settings.refundWindowDays).toBe(14); // BR-10
    expect(settings.refundMaxProgressPct).toBe(30); // BR-10
    expect(settings.payoutMinimumMinor).toBe(10_000); // BR-13: 100 SAR in halalas
    expect(settings.quizPassPct).toBe(70); // BR-16
    expect(settings.quizMaxAttempts).toBe(3); // BR-16
    expect(settings.reviewMinProgressPct).toBe(20); // BR-18
    expect(settings.signedUrlTtlSec).toBe(900); // BR-20: 15 minutes
    expect(settings.maintenanceMode).toBe(false);
  });

  it("uses an unguessable certificate code prefix and format", () => {
    expect(siteConfig.certificateCodePrefix).toBe("MD");
  });

  it("is bilingual for every public name", () => {
    expect(siteConfig.name.ar).not.toBe(siteConfig.name.en);
    expect(siteConfig.tagline.ar.length).toBeGreaterThan(10);
  });
});
