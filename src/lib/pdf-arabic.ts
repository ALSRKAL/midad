/**
 * RTL text placement for pdf-lib (ADR-0014).
 *
 * Pure geometry helpers shared by invoices and certificates; no I/O.
 *
 * Fontkit shapes Arabic correctly but does not place mixed runs. These helpers draw token by token
 * from the right (or left) edge, keeping numerals in LTR order inside otherwise RTL lines.
 */

import { rgb, type PDFFont, type PDFPage } from "pdf-lib";

const DEFAULT_INK = rgb(0.15, 0.12, 0.1);

export function drawArabicRight(
  page: PDFPage,
  text: string,
  y: number,
  size: number,
  font: PDFFont,
  rightX: number,
  color = DEFAULT_INK,
): void {
  const space = font.widthOfTextAtSize(" ", size);
  let x = rightX;
  for (const token of text.split(/\s+/).filter(Boolean)) {
    const width = font.widthOfTextAtSize(token, size);
    x -= width;
    page.drawText(token, { x, y, size, font, color });
    x -= space;
  }
}

export function drawArabicLeft(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  size: number,
  font: PDFFont,
  color = DEFAULT_INK,
): void {
  const space = font.widthOfTextAtSize(" ", size);
  let cursor = x;
  for (const token of text.split(/\s+/).filter(Boolean).reverse()) {
    page.drawText(token, { x: cursor, y, size, font, color });
    cursor += font.widthOfTextAtSize(token, size) + space;
  }
}

/** Arabic month + two numeric tokens; avoids slash-separated runs that bidi engines reorder. */
export function arabicDate(date: Date): string {
  return new Intl.DateTimeFormat("ar-SA-u-nu-latn", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Riyadh",
  }).format(date);
}

/** Centres an RTL token line on the page while keeping token order right-to-left. */
export function drawArabicCentered(
  page: PDFPage,
  text: string,
  y: number,
  size: number,
  font: PDFFont,
  centerX: number,
  color = DEFAULT_INK,
): void {
  const tokens = text.split(/\s+/).filter(Boolean);
  const space = font.widthOfTextAtSize(" ", size);
  const total = tokens.reduce(
    (width, token) => width + font.widthOfTextAtSize(token, size) + space,
    0,
  );
  let x = centerX + total / 2;
  for (const token of tokens) {
    const width = font.widthOfTextAtSize(token, size);
    x -= width;
    page.drawText(token, { x, y, size, font, color });
    x -= space;
  }
}
