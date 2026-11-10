import { NextResponse } from "next/server";

import { AppError, toAppError } from "@/lib/errors";
import { getPlayableVideo } from "@/server/player";
import { getCurrentSession } from "@/server/session";
import { getPrivateObjectText, signedDownloadUrl } from "@/server/storage";

/**
 * Signed HLS manifest (BR-20).
 *
 * The route authorises the lesson, reads the private playlist, and replaces every segment with a
 * 15-minute signed URL. The player therefore never receives an unsigned private key; expiry of the
 * segment URLs matches the configured signed-URL TTL.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ lessonId: string }> },
): Promise<NextResponse> {
  try {
    const { lessonId } = await context.params;
    const video = await getPlayableVideo(await getCurrentSession(), lessonId);
    const playlist = await getPrivateObjectText(video.hlsKey);
    const directory = video.hlsKey.includes("/")
      ? video.hlsKey.slice(0, video.hlsKey.lastIndexOf("/"))
      : "";

    const lines = await Promise.all(
      playlist.split("\n").map(async (line) => {
        const trimmed = line.trim();
        if (trimmed === "" || trimmed.startsWith("#")) return line;
        if (/^https?:\/\//.test(trimmed)) return line;
        const key = directory === "" ? trimmed : `${directory}/${trimmed}`;
        return await signedDownloadUrl(key);
      }),
    );

    return new NextResponse(lines.join("\n"), {
      status: 200,
      headers: {
        "content-type": "application/vnd.apple.mpegurl",
        "cache-control": "private, no-store",
      },
    });
  } catch (error) {
    const appError = toAppError(error);
    const status = error instanceof AppError ? error.status : 500;
    return NextResponse.json({ error: appError.kind }, { status });
  }
}
