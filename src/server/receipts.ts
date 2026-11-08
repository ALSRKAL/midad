import "server-only";

import { env } from "@/env";
import { logger } from "@/server/logger";
import { db } from "@/server/db";
import { enqueueEmail } from "@/server/email-queue";

/** Purchase receipt (P06-T05) is queued after the webhook commits; the worker sends it. */
export async function sendReceiptEmail(orderId: string): Promise<void> {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        totalCents: true,
        currency: true,
        user: { select: { name: true, email: true, locale: true } },
        items: { select: { titleSnapshot: true } },
      },
    });
    if (order === null) return;

    const locale = order.user.locale === "EN" ? "en" : "ar";
    const amount = `${(order.totalCents / 100).toFixed(2)} ${order.currency}`;
    await enqueueEmail({
      to: order.user.email,
      template: "purchase_receipt",
      locale,
      data: {
        name: order.user.name,
        amount,
        items: order.items.map((item) => item.titleSnapshot),
        invoiceUrl: `${env.APP_URL}/api/orders/${order.id}/invoice?lang=${locale}`,
        purchasesUrl: `${env.APP_URL}/${locale}/purchases`,
      },
    });
  } catch (error) {
    logger.error({ err: error, orderId }, "purchase receipt enqueue failed");
  }
}
