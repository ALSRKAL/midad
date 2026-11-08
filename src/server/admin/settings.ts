/**
 * Platform settings writes (P10-T04). Each key is validated before an upsert; the audit row stores
 * the full before/after map so a later operator can see exactly what changed.
 */

import "server-only";

import { db } from "@/server/db";
import { getPlatformSettings, type PlatformSettings } from "@/server/platform-settings";

export type PlatformSettingsInput = PlatformSettings;

export const PLATFORM_SETTING_KEYS = [
  "commissionBps",
  "vatBps",
  "defaultCurrency",
  "refundWindowDays",
  "refundMaxProgressPct",
  "reviewMinProgressPct",
  "payoutMinimumMinor",
  "signedUrlTtlSec",
  "maintenanceMode",
] as const;

function assertRange(value: number, min: number, max: number, field: string): void {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`INVALID_${field.toUpperCase()}`);
  }
}

export async function updatePlatformSettings(input: {
  adminId: string;
  values: PlatformSettingsInput;
}): Promise<void> {
  const values = input.values;
  assertRange(values.commissionBps, 0, 10_000, "commissionBps");
  assertRange(values.vatBps, 0, 10_000, "vatBps");
  assertRange(values.refundWindowDays, 0, 365, "refundWindowDays");
  assertRange(values.refundMaxProgressPct, 0, 100, "refundMaxProgressPct");
  assertRange(values.reviewMinProgressPct, 0, 100, "reviewMinProgressPct");
  assertRange(values.payoutMinimumMinor, 0, 100_000_000, "payoutMinimumMinor");
  assertRange(values.signedUrlTtlSec, 60, 86_400, "signedUrlTtlSec");
  if (values.defaultCurrency !== "SAR" && values.defaultCurrency !== "USD") {
    throw new Error("INVALID_CURRENCY");
  }

  const before = await getPlatformSettings();
  await db.$transaction(async (tx) => {
    for (const key of PLATFORM_SETTING_KEYS) {
      const value = values[key];
      await tx.platformSetting.upsert({
        where: { key },
        create: { key, value, updatedById: input.adminId },
        update: { value, updatedById: input.adminId },
      });
    }
    await tx.auditLog.create({
      data: {
        actorId: input.adminId,
        action: "platform.settings.updated",
        entity: "PlatformSetting",
        entityId: null,
        before,
        after: values,
      },
    });
  });
}
