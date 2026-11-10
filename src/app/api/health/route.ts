import { NextResponse } from "next/server";

import { runHealthChecks } from "@/server/health";

/**
 * GET /api/health — liveness/readiness for Docker, CI and uptime monitors.
 *
 * 200 when every required dependency answers, 503 otherwise. The body names each check so an
 * operator can see *what* is down; it never includes versions, connection strings or error text.
 */
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const { status, checks } = await runHealthChecks();
  const ok = status === "ok";

  return NextResponse.json(
    {
      status,
      checkedAt: new Date().toISOString(),
      checks: checks.map((check) => ({
        name: check.name,
        required: check.required,
        ok: check.ok,
        durationMs: check.durationMs,
        ...(check.detail === undefined ? {} : { detail: check.detail }),
      })),
    },
    {
      status: ok ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
