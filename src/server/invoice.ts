import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";

import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";

import { siteConfig } from "@/config/site";
import { formatDate } from "@/lib/dates";
import { mulDivRoundHalfEven } from "@/lib/money";
import { db } from "@/server/db";

/**
 * Bilingual invoice (P06-T05).
 *
 * pdf-lib/fontkit shapes Arabic letters correctly but has no bidi run placement, so Arabic lines are
 * drawn token by token from the right edge. Each token keeps its internal order (fontkit shapes it),
 * numbers stay LTR, and mixed lines such as "10 نوفمبر 2026" place the date parts correctly. The
 * document contains an Arabic page then an English page with the same frozen order data.
 */

/** A date made only of an Arabic month and two number tokens: no slash-separated run to reorder. */
function arabicDate(date: Date): string {
  return new Intl.DateTimeFormat("ar-SA-u-nu-latn", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Riyadh",
  }).format(date);
}

function moneyText(amount: number, currency: string): string {
  const value = (amount / 100).toFixed(2);
  return `${value} ${currency}`;
}

type InvoiceItem = {
  title: string;
  unitPriceCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
};

type InvoiceData = {
  id: string;
  createdAt: Date;
  paidAt: Date | null;
  currency: string;
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
  vatBps: number;
  couponCode: string | null;
  user: { name: string; email: string };
  items: InvoiceItem[];
};

async function loadInvoice(orderId: string): Promise<InvoiceData | null> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      createdAt: true,
      paidAt: true,
      currency: true,
      subtotalCents: true,
      discountCents: true,
      taxCents: true,
      totalCents: true,
      vatBps: true,
      couponCode: true,
      user: { select: { name: true, email: true } },
      items: {
        select: {
          titleSnapshot: true,
          unitPriceCents: true,
          discountCents: true,
        },
      },
    },
  });
  if (order === null) return null;

  return {
    ...order,
    items: order.items.map((item) => {
      const taxable = item.unitPriceCents - item.discountCents;
      const taxCents = mulDivRoundHalfEven(taxable, order.vatBps, 10_000);
      return {
        title: item.titleSnapshot,
        unitPriceCents: item.unitPriceCents,
        discountCents: item.discountCents,
        taxCents,
        totalCents: taxable + taxCents,
      };
    }),
  };
}

type Fonts = { regular: PDFFont; bold: PDFFont };

function drawArabicRight(
  page: PDFPage,
  text: string,
  y: number,
  size: number,
  font: PDFFont,
  rightX: number,
  color = rgb(0.15, 0.12, 0.1),
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

/** Places an Arabic/mixed line from a left origin; tokens are laid out in reverse logical order. */
function drawArabicLeft(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  size: number,
  font: PDFFont,
  color = rgb(0.15, 0.12, 0.1),
): void {
  const space = font.widthOfTextAtSize(" ", size);
  let cursor = x;
  for (const token of text.split(/\s+/).filter(Boolean).reverse()) {
    page.drawText(token, { x: cursor, y, size, font, color });
    cursor += font.widthOfTextAtSize(token, size) + space;
  }
}

function arabicPage(page: PDFPage, data: InvoiceData, fonts: Fonts): void {
  const width = page.getWidth();
  const margin = 50;
  const right = width - margin;
  let y = page.getHeight() - margin;
  const ink = rgb(0.15, 0.12, 0.1);
  const muted = rgb(0.4, 0.37, 0.33);

  drawArabicRight(page, siteConfig.name.ar, y, 24, fonts.bold, right);
  drawArabicRight(page, "فاتورة", y - 30, 16, fonts.bold, right, muted);
  y -= 70;

  drawArabicRight(page, "رقم الطلب", y, 10, fonts.regular, right, muted);
  page.drawText(data.id, { x: margin, y, size: 10, font: fonts.regular, color: ink });
  drawArabicRight(page, "التاريخ", y - 18, 10, fonts.regular, right, muted);
  drawArabicLeft(
    page,
    arabicDate(data.paidAt ?? data.createdAt),
    margin,
    y - 18,
    10,
    fonts.regular,
    ink,
  );
  drawArabicRight(page, `إلى: ${data.user.name}`, y - 36, 10, fonts.regular, right);
  page.drawText(data.user.email, {
    x: margin,
    y: y - 36,
    size: 9,
    font: fonts.regular,
    color: muted,
  });
  y -= 70;

  page.drawLine({
    start: { x: margin, y },
    end: { x: right, y },
    thickness: 1,
    color: rgb(0.85, 0.82, 0.77),
  });
  y -= 22;

  drawArabicRight(page, "البيان", y, 10, fonts.bold, right, muted);
  page.drawText("SAR", { x: margin, y, size: 10, font: fonts.bold, color: muted });
  y -= 18;

  for (const item of data.items) {
    drawArabicRight(page, item.title, y, 10, fonts.regular, right);
    page.drawText(moneyText(item.totalCents, data.currency), {
      x: margin,
      y,
      size: 10,
      font: fonts.regular,
      color: ink,
    });
    if (item.discountCents > 0) {
      drawArabicRight(page, "الخصم والضريبة", y - 14, 8, fonts.regular, right, muted);
      page.drawText(
        `${moneyText(item.discountCents, data.currency)} · ${moneyText(item.taxCents, data.currency)}`,
        { x: margin, y: y - 14, size: 8, font: fonts.regular, color: muted },
      );
      y -= 14;
    }
    y -= 22;
  }

  y -= 10;
  page.drawLine({
    start: { x: margin, y },
    end: { x: right, y },
    thickness: 1,
    color: rgb(0.85, 0.82, 0.77),
  });
  y -= 24;

  const rows: Array<[string, string]> = [
    ["المجموع الفرعي", moneyText(data.subtotalCents, data.currency)],
  ];
  if (data.discountCents > 0) {
    rows.push(["الخصم", `− ${moneyText(data.discountCents, data.currency)}`]);
  }
  rows.push(["ضريبة القيمة المضافة", moneyText(data.taxCents, data.currency)]);

  for (const [label, value] of rows) {
    drawArabicRight(page, label, y, 10, fonts.regular, right, muted);
    page.drawText(value, { x: margin, y, size: 10, font: fonts.regular, color: ink });
    y -= 18;
  }

  y -= 4;
  drawArabicRight(page, "الإجمالي المستحق", y, 12, fonts.bold, right);
  page.drawText(moneyText(data.totalCents, data.currency), {
    x: margin,
    y,
    size: 12,
    font: fonts.bold,
    color: ink,
  });

  const footerY = margin + 18;
  drawArabicRight(
    page,
    `شكرًا لشرائك من ${siteConfig.name.ar}.`,
    footerY,
    9,
    fonts.regular,
    right,
    muted,
  );
  drawArabicRight(page, "للدعم", footerY - 14, 8, fonts.regular, right, muted);
  page.drawText(siteConfig.supportEmail, {
    x: margin,
    y: footerY - 14,
    size: 8,
    font: fonts.regular,
    color: muted,
  });
  drawArabicRight(
    page,
    "فاتورة إلكترونية صادرة آليًا.",
    footerY - 28,
    8,
    fonts.regular,
    right,
    muted,
  );
}

function englishPage(page: PDFPage, data: InvoiceData, fonts: Fonts): void {
  const margin = 50;
  const right = page.getWidth() - margin;
  let y = page.getHeight() - margin;
  const ink = rgb(0.15, 0.12, 0.1);
  const muted = rgb(0.4, 0.37, 0.33);

  page.drawText(siteConfig.name.en, { x: margin, y, size: 24, font: fonts.bold, color: ink });
  page.drawText("INVOICE", { x: margin, y: y - 30, size: 16, font: fonts.bold, color: muted });
  y -= 70;

  page.drawText(`Order: ${data.id}`, { x: margin, y, size: 10, font: fonts.regular, color: ink });
  page.drawText(`Date: ${formatDate(data.paidAt ?? data.createdAt, "en")}`, {
    x: margin,
    y: y - 18,
    size: 10,
    font: fonts.regular,
    color: ink,
  });
  page.drawText(`Billed to: ${data.user.email}`, {
    x: margin,
    y: y - 36,
    size: 10,
    font: fonts.regular,
    color: ink,
  });
  y -= 70;

  page.drawLine({
    start: { x: margin, y },
    end: { x: right, y },
    thickness: 1,
    color: rgb(0.85, 0.82, 0.77),
  });
  y -= 22;

  page.drawText("Description", { x: margin, y, size: 10, font: fonts.bold, color: muted });
  const amountWidth = fonts.bold.widthOfTextAtSize("Amount", 10);
  page.drawText("Amount", { x: right - amountWidth, y, size: 10, font: fonts.bold, color: muted });
  y -= 18;

  for (const item of data.items) {
    page.drawText(item.title, { x: margin, y, size: 10, font: fonts.regular, color: ink });
    const text = moneyText(item.totalCents, data.currency);
    page.drawText(text, {
      x: right - fonts.regular.widthOfTextAtSize(text, 10),
      y,
      size: 10,
      font: fonts.regular,
      color: ink,
    });
    if (item.discountCents > 0) {
      page.drawText(
        `Discount: ${moneyText(item.discountCents, data.currency)} · VAT: ${moneyText(item.taxCents, data.currency)}`,
        { x: margin, y: y - 14, size: 8, font: fonts.regular, color: muted },
      );
      y -= 14;
    }
    y -= 22;
  }

  y -= 10;
  page.drawLine({
    start: { x: margin, y },
    end: { x: right, y },
    thickness: 1,
    color: rgb(0.85, 0.82, 0.77),
  });
  y -= 24;

  const rows: Array<[string, string]> = [
    ["Subtotal", moneyText(data.subtotalCents, data.currency)],
  ];
  if (data.discountCents > 0) {
    rows.push([
      `Discount${data.couponCode === null ? "" : ` (${data.couponCode})`}`,
      `− ${moneyText(data.discountCents, data.currency)}`,
    ]);
  }
  rows.push([`VAT (${data.vatBps / 100}%)`, moneyText(data.taxCents, data.currency)]);

  for (const [label, value] of rows) {
    page.drawText(label, { x: margin, y, size: 10, font: fonts.regular, color: muted });
    page.drawText(value, {
      x: right - fonts.regular.widthOfTextAtSize(value, 10),
      y,
      size: 10,
      font: fonts.regular,
      color: ink,
    });
    y -= 18;
  }

  y -= 4;
  page.drawText("Total paid", { x: margin, y, size: 12, font: fonts.bold, color: ink });
  const total = moneyText(data.totalCents, data.currency);
  page.drawText(total, {
    x: right - fonts.bold.widthOfTextAtSize(total, 12),
    y,
    size: 12,
    font: fonts.bold,
    color: ink,
  });

  const footerY = margin + 18;
  page.drawText(
    `Thank you for learning with ${siteConfig.name.en}. Support: ${siteConfig.supportEmail}`,
    { x: margin, y: footerY, size: 9, font: fonts.regular, color: muted },
  );
  page.drawText("This invoice was generated automatically.", {
    x: margin,
    y: footerY - 14,
    size: 8,
    font: fonts.regular,
    color: muted,
  });
}

export async function generateInvoicePdf(orderId: string): Promise<Uint8Array | null> {
  const data = await loadInvoice(orderId);
  if (data === null) return null;

  const [regularBytes, boldBytes] = await Promise.all([
    readFile(join(process.cwd(), "assets", "fonts", "IBMPlexSansArabic-Regular.ttf")),
    readFile(join(process.cwd(), "assets", "fonts", "IBMPlexSansArabic-SemiBold.ttf")),
  ]);

  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const regular = await pdf.embedFont(regularBytes, { subset: true });
  const bold = await pdf.embedFont(boldBytes, { subset: true });
  const fonts: Fonts = { regular, bold };

  pdf.setTitle(`Invoice ${data.id}`);
  pdf.setAuthor(siteConfig.name.en);
  pdf.setSubject("Bilingual course invoice");

  arabicPage(pdf.addPage([595, 842]), data, fonts);
  englishPage(pdf.addPage([595, 842]), data, fonts);

  return pdf.save();
}
