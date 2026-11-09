"use server";

import { z } from "zod";

import { unauthorized, validationFailed } from "@/lib/errors";
import { createAction } from "@/server/action";
import { updatePlatformSettings } from "@/server/admin/settings";

/** Platform settings update (P10-T04). */

const schema = z.object({
  commissionBps: z.number().int().min(0).max(10_000),
  vatBps: z.number().int().min(0).max(10_000),
  defaultCurrency: z.enum(["SAR", "USD"]),
  refundWindowDays: z.number().int().min(0).max(365),
  refundMaxProgressPct: z.number().int().min(0).max(100),
  reviewMinProgressPct: z.number().int().min(0).max(100),
  payoutMinimumMinor: z.number().int().min(0).max(100_000_000),
  signedUrlTtlSec: z.number().int().min(60).max(86_400),
  maintenanceMode: z.boolean(),
});

const updateInternal = createAction<z.infer<typeof schema>, { ok: true }>({
  name: "admin.updateSettings",
  schema,
  roles: ["ADMIN"],
  handler: async ({ input, user }) => {
    if (user === null) throw unauthorized();
    try {
      await updatePlatformSettings({ adminId: user.id, values: input });
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("INVALID_")) {
        throw validationFailed({ settings: [error.message] });
      }
      throw error;
    }
    return { ok: true };
  },
});

export async function updatePlatformSettingsAction(input: unknown) {
  return updateInternal(input);
}
