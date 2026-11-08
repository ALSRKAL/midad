import "server-only";

import { siteConfig } from "@/config/site";
import { db } from "@/server/db";

/**
 * Platform settings (P06).
 *
 * The seeded defaults live in `siteConfig`; the database row overrides them at runtime so an admin
 * can change VAT or the commission without a deploy. Reads are cached per request via React's
 * `cache` only when called from a request boundary; this helper stays a plain query because the
 * webhook and CLI paths must also reach it.
 */

export type PlatformSettings = {
  commissionBps: number;
  vatBps: number;
  defaultCurrency: "SAR" | "USD";
  refundWindowDays: number;
  refundMaxProgressPct: number;
  reviewMinProgressPct: number;
  payoutMinimumMinor: number;
  signedUrlTtlSec: number;
  maintenanceMode: boolean;
};

const DEFAULTS: PlatformSettings = {
  commissionBps: siteConfig.defaultPlatformSettings.commissionBps,
  vatBps: siteConfig.defaultPlatformSettings.vatBps,
  defaultCurrency: "SAR",
  refundWindowDays: siteConfig.defaultPlatformSettings.refundWindowDays,
  refundMaxProgressPct: siteConfig.defaultPlatformSettings.refundMaxProgressPct,
  reviewMinProgressPct: siteConfig.defaultPlatformSettings.reviewMinProgressPct,
  payoutMinimumMinor: siteConfig.defaultPlatformSettings.payoutMinimumMinor,
  signedUrlTtlSec: siteConfig.defaultPlatformSettings.signedUrlTtlSec,
  maintenanceMode: siteConfig.defaultPlatformSettings.maintenanceMode,
};

function asInt(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isInteger(value) ? value : fallback;
}

/** Reads all commerce settings in one query, falling back to the seeded defaults per key. */
export async function getPlatformSettings(): Promise<PlatformSettings> {
  const rows = await db.platformSetting.findMany({
    where: {
      key: {
        in: [
          "commissionBps",
          "vatBps",
          "defaultCurrency",
          "refundWindowDays",
          "refundMaxProgressPct",
          "reviewMinProgressPct",
          "payoutMinimumMinor",
          "signedUrlTtlSec",
          "maintenanceMode",
        ],
      },
    },
    select: { key: true, value: true },
  });
  const values = new Map(rows.map((row) => [row.key, row.value]));

  return {
    commissionBps: asInt(values.get("commissionBps"), DEFAULTS.commissionBps),
    vatBps: asInt(values.get("vatBps"), DEFAULTS.vatBps),
    defaultCurrency:
      values.get("defaultCurrency") === "USD" || values.get("defaultCurrency") === "SAR"
        ? (values.get("defaultCurrency") as "SAR" | "USD")
        : DEFAULTS.defaultCurrency,
    refundWindowDays: asInt(values.get("refundWindowDays"), DEFAULTS.refundWindowDays),
    refundMaxProgressPct: asInt(values.get("refundMaxProgressPct"), DEFAULTS.refundMaxProgressPct),
    reviewMinProgressPct: asInt(values.get("reviewMinProgressPct"), DEFAULTS.reviewMinProgressPct),
    payoutMinimumMinor: asInt(values.get("payoutMinimumMinor"), DEFAULTS.payoutMinimumMinor),
    signedUrlTtlSec: asInt(values.get("signedUrlTtlSec"), DEFAULTS.signedUrlTtlSec),
    maintenanceMode:
      typeof values.get("maintenanceMode") === "boolean"
        ? (values.get("maintenanceMode") as boolean)
        : DEFAULTS.maintenanceMode,
  };
}
