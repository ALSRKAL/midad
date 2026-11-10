import { NextResponse } from "next/server";
import { z } from "zod";

import { env } from "@/env";
import { saveWatchProgress } from "@/server/progress";
import { getCurrentSession } from "@/server/session";

/**
 * Last-moment progress beacon (BR-14: save on unload). `navigator.sendBeacon` cannot call a server
 * action, so this small route accepts the same shape; origin is checked and the session is required.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  lessonId: z.string().min(1).max(64),
  startSec: z.number().finite().min(0).max(86_400),
  endSec: z.number().finite().min(0).max(86_400),
  positionSec: z.number().finite().min(0).max(86_400),
});

export async function POST(request: Request): Promise<NextResponse> {
  const origin = request.headers.get("origin");
  if (origin !== null && origin !== env.APP_URL) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  const user = await getCurrentSession();
  if (user === null) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 422 });

  try {
    await saveWatchProgress({ userId: user.id, ...parsed.data });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "NOT_SAVED" }, { status: 409 });
  }
}
