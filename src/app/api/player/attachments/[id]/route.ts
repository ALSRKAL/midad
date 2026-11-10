import { NextResponse } from "next/server";

import { AppError, toAppError } from "@/lib/errors";
import { signLessonAttachment } from "@/server/player";
import { getCurrentSession } from "@/server/session";

/** Signed attachment download for an enrolled learner or a preview lesson (BR-20). */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await context.params;
    const signed = await signLessonAttachment(await getCurrentSession(), id);
    return NextResponse.redirect(signed.url, { status: 302 });
  } catch (error) {
    const appError = toAppError(error);
    const status = error instanceof AppError ? error.status : 500;
    return NextResponse.json({ error: appError.kind }, { status });
  }
}
