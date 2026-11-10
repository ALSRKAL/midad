import { NextResponse } from "next/server";

import { AppError, toAppError } from "@/lib/errors";
import { getLessonCaptions } from "@/server/player";
import { getCurrentSession } from "@/server/session";
import { getPrivateObjectText } from "@/server/storage";

/**
 * Same-origin VTT delivery after the same access check as the video (BR-20).
 *
 * Text tracks are subject to CORS in the browser, and a signed MinIO URL is cross-origin in local
 * development. Serving the file through this authenticated route avoids the console error while
 * keeping the private key server-side.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ lessonId: string }> },
): Promise<NextResponse> {
  try {
    const { lessonId } = await context.params;
    const captions = await getLessonCaptions(await getCurrentSession(), lessonId);
    const vtt = await getPrivateObjectText(captions.captionsKey);
    return new NextResponse(vtt, {
      status: 200,
      headers: {
        "content-type": "text/vtt; charset=utf-8",
        "cache-control": "private, no-store",
      },
    });
  } catch (error) {
    const appError = toAppError(error);
    const status = error instanceof AppError ? error.status : 500;
    return NextResponse.json({ error: appError.kind }, { status });
  }
}
