import { NextResponse } from "next/server";

import { env } from "@/env";
import { generateCertificatePdf } from "@/lib/certificate-pdf";
import { getCertificateByCode } from "@/server/certificates";
import { db } from "@/server/db";
import { storage, signedDownloadUrl } from "@/server/storage";

/**
 * Certificate PDF (P08-T03). The worker normally generates and stores it; this route serves the
 * stored copy with a signed URL and falls back to on-demand generation if the worker is behind.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ code: string }> },
): Promise<NextResponse> {
  const { code } = await context.params;
  const certificate = await getCertificateByCode(code);
  if (certificate === null) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  if (certificate.pdfKey !== null) {
    return NextResponse.redirect(await signedDownloadUrl(certificate.pdfKey), { status: 302 });
  }

  const bytes = await generateCertificatePdf({
    code: certificate.code,
    recipientName: certificate.recipientName,
    courseTitleAr: certificate.course.titleAr,
    courseTitleEn: certificate.course.titleEn,
    issuedAt: certificate.issuedAt,
    instructorName: certificate.instructorName,
    verifyUrl: `${env.APP_URL}/ar/verify/${certificate.code}`,
  });
  const key = `certificates/${certificate.code}.pdf`;
  await storage.putObject({
    bucket: "private",
    key,
    body: bytes,
    contentType: "application/pdf",
    cacheControl: "private, max-age=31536000, immutable",
  });
  await db.certificate.updateMany({
    where: { code: certificate.code, pdfKey: null },
    data: { pdfKey: key },
  });

  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="midad-certificate-${certificate.code}.pdf"`,
      "cache-control": "private, no-store",
    },
  });
}
