import { NextResponse } from "next/server";

import { db } from "@/server/db";
import { generateInvoicePdf } from "@/server/invoice";
import { getCurrentSession } from "@/server/session";

/**
 * Bilingual invoice download (P06-T05). Owners may download their own paid invoice; admins may
 * download any. The file is generated on demand from frozen order rows, never from client data.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const user = await getCurrentSession();
  if (user === null) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id } = await context.params;
  const order = await db.order.findUnique({
    where: { id },
    select: { id: true, userId: true, status: true },
  });
  if (order === null) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (order.userId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  if (
    order.status !== "PAID" &&
    order.status !== "PARTIALLY_REFUNDED" &&
    order.status !== "REFUNDED"
  ) {
    return NextResponse.json({ error: "NOT_PAID" }, { status: 409 });
  }

  const bytes = await generateInvoicePdf(order.id);
  if (bytes === null) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="midad-invoice-${order.id}.pdf"`,
      "cache-control": "private, no-store",
    },
  });
}
