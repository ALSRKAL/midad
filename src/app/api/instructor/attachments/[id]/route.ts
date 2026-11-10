/**
 * Attachment download for the builder (P04-T05).
 *
 * A route handler, not an action: the browser needs a file response. It checks the session and that
 * the attachment belongs to a course this instructor owns, then redirects to a 15-minute signed URL.
 * A learner-facing download with enrollment checks is added with the player (P07).
 */

import { NextResponse } from "next/server";

import { findAttachmentForDownload } from "@/server/lesson-content";
import { getInstructorProfileId } from "@/server/instructor-courses";
import { getCurrentSession } from "@/server/session";
import { signedDownloadUrl } from "@/server/storage";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const user = await getCurrentSession();
  if (user === null) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const instructorId = await getInstructorProfileId(user.id);
  if (instructorId === null) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const { id } = await context.params;
  const attachment = await findAttachmentForDownload(instructorId, id);
  if (attachment === null) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const url = await signedDownloadUrl(attachment.fileKey);
  return NextResponse.redirect(url, 302);
}
