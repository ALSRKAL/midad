import { readFile } from "node:fs/promises";
import { join } from "node:path";

import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";
import QRCode from "qrcode";

import { siteConfig } from "@/config/site";
import { arabicDate, drawArabicCentered, drawArabicLeft, drawArabicRight } from "@/lib/pdf-arabic";

/**
 * Bilingual certificate PDF (P08-T03, BR-17).
 *
 * Pure rendering from frozen certificate data; no database access.
 *
 * One landscape page: Arabic primary content placed token-by-token for correct RTL, English
 * subtitle, frozen recipient name, verification URL as a real scannable QR, and the certificate
 * code in a LTR line. Lives in `lib` so the worker can generate it without the Next server runtime.
 */

export type CertificatePdfData = {
  code: string;
  recipientName: string;
  courseTitleAr: string | null;
  courseTitleEn: string | null;
  issuedAt: Date;
  instructorName: string;
  verifyUrl: string;
};

export async function generateCertificatePdf(data: CertificatePdfData): Promise<Uint8Array> {
  const [regularBytes, boldBytes] = await Promise.all([
    readFile(join(process.cwd(), "assets", "fonts", "IBMPlexSansArabic-Regular.ttf")),
    readFile(join(process.cwd(), "assets", "fonts", "IBMPlexSansArabic-SemiBold.ttf")),
  ]);

  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const regular = await pdf.embedFont(regularBytes, { subset: true });
  const bold = await pdf.embedFont(boldBytes, { subset: true });
  const page = pdf.addPage([842, 595]);
  const ink = rgb(0.086, 0.122, 0.149);
  const muted = rgb(0.357, 0.392, 0.439);
  const paper = rgb(0.98, 0.973, 0.957);
  const accent = rgb(0.784, 0.537, 0.102);
  const center = 421;

  page.drawRectangle({ x: 0, y: 0, width: 842, height: 595, color: paper });
  page.drawRectangle({
    x: 28,
    y: 28,
    width: 786,
    height: 539,
    borderColor: ink,
    borderWidth: 1.5,
    color: paper,
  });
  page.drawRectangle({ x: 28, y: 552, width: 786, height: 15, color: ink });
  page.drawRectangle({ x: 28, y: 28, width: 786, height: 5, color: accent });

  drawArabicCentered(page, siteConfig.name.ar, 515, 20, bold, center, muted);
  drawArabicCentered(page, "شهادة إتمام", 465, 38, bold, center, ink);
  page.drawText("CERTIFICATE OF COMPLETION", {
    x: center - regular.widthOfTextAtSize("CERTIFICATE OF COMPLETION", 11) / 2,
    y: 438,
    size: 11,
    font: regular,
    color: muted,
  });

  drawArabicCentered(page, "تُمنح هذه الشهادة إلى", 390, 14, regular, center, muted);
  drawArabicCentered(page, data.recipientName, 345, 32, bold, center, ink);

  drawArabicCentered(page, "لإتمامه بنجاح دورة", 300, 13, regular, center, muted);
  drawArabicCentered(
    page,
    data.courseTitleAr ?? data.courseTitleEn ?? "",
    264,
    22,
    bold,
    center,
    ink,
  );
  if (data.courseTitleEn !== null && data.courseTitleEn !== "") {
    page.drawText(data.courseTitleEn, {
      x: center - regular.widthOfTextAtSize(data.courseTitleEn, 12) / 2,
      y: 238,
      size: 12,
      font: regular,
      color: muted,
    });
  }

  drawArabicRight(page, `المدرب: ${data.instructorName}`, 198, 11, regular, 760, muted);
  drawArabicLeft(page, arabicDate(data.issuedAt), 82, 198, 11, regular, muted);

  const qr = await QRCode.toBuffer(data.verifyUrl, {
    type: "png",
    width: 240,
    margin: 1,
    color: { dark: "#16385F", light: "#FAF8F4" },
  });
  const image = await pdf.embedPng(qr);
  page.drawImage(image, { x: 82, y: 76, width: 96, height: 96 });
  page.drawText("VERIFY", { x: 82, y: 184, size: 8, font: regular, color: muted });
  page.drawText(data.code, { x: 82, y: 64, size: 10, font: bold, color: ink });
  page.drawText(data.verifyUrl, {
    x: 82,
    y: 48,
    size: 7,
    font: regular,
    color: muted,
  });

  drawArabicRight(page, "شهادة موثّقة برمز فريد", 100, 11, regular, 760, muted);
  drawArabicRight(page, `رقم التحقق: ${data.code}`, 82, 9, regular, 760, muted);

  pdf.setTitle(`Certificate ${data.code}`);
  pdf.setAuthor(siteConfig.name.en);
  pdf.setSubject(`Certificate of completion — ${data.courseTitleEn ?? data.courseTitleAr ?? ""}`);

  return pdf.save();
}
