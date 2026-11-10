import { NextResponse } from "next/server";

import { getPlatformSettings } from "@/server/platform-settings";

/** Internal maintenance flag for middleware (P10-T04). Public read-only boolean, never cached. */

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    const settings = await getPlatformSettings();
    return NextResponse.json(
      { enabled: settings.maintenanceMode },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    // Fail open: an unavailable settings table must not take the whole site down.
    return NextResponse.json({ enabled: false }, { headers: { "Cache-Control": "no-store" } });
  }
}
