/**
 * Container smoke test for the worker image (P14-T06).
 *
 * Runs inside the worker container and proves the slimmed image can still produce both binary
 * documents the platform promises: a bilingual certificate from pure data, and a bilingual invoice
 * from a real paid order in the database. It writes the files under /tmp and asserts the PDF magic.
 */

import { writeFile } from "node:fs/promises";
import { join } from "node:path";

import { generateCertificatePdf } from "../src/lib/certificate-pdf";
import { generateInvoicePdf } from "../src/server/invoice";
import { db } from "../src/server/db";

async function main(): Promise<void> {
  const certificate = await generateCertificatePdf({
    code: "MD-SMOKE-0001",
    recipientName: "متعلّم الاختبار",
    courseTitleAr: "دورة اختبار الصورة المصغرة",
    courseTitleEn: "Container smoke course",
    issuedAt: new Date("2026-11-11T00:00:00.000Z"),
    instructorName: "مدرب الاختبار",
    verifyUrl: "https://example.test/verify/MD-SMOKE-0001",
  });
  const certificatePath = join("/tmp", "certificate-smoke.pdf");
  await writeFile(certificatePath, certificate);
  if (Buffer.from(certificate).subarray(0, 5).toString() !== "%PDF-") {
    throw new Error("Certificate is not a PDF");
  }

  const order = await db.order.findFirst({
    where: { status: "PAID", items: { some: {} } },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (order === null) throw new Error("No paid order to invoice");
  const invoice = await generateInvoicePdf(order.id);
  if (invoice === null) throw new Error("Invoice generation returned null");
  const invoicePath = join("/tmp", "invoice-smoke.pdf");
  await writeFile(invoicePath, invoice);
  if (Buffer.from(invoice).subarray(0, 5).toString() !== "%PDF-") {
    throw new Error("Invoice is not a PDF");
  }

  console.log(
    `[worker-smoke] certificate ${certificate.byteLength} bytes; invoice ${invoice.byteLength} bytes`,
  );
  await db.$disconnect();
}

void main().catch((error: unknown) => {
  console.error("[worker-smoke]", error);
  process.exit(1);
});
