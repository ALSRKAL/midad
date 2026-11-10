import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { logger } from "@/server/logger";
import {
  expireCheckoutSession,
  fulfillCheckoutSession,
  recordWebhookEvent,
} from "@/server/checkout";
import { createNotification } from "@/server/notifications";
import { sendReceiptEmail } from "@/server/receipts";
import { getStripeForWebhook, isStripeConfigured, webhookSecret } from "@/server/stripe";

/**
 * Stripe webhook (P06-T04, BR-08).
 *
 * This route is the only place an Enrollment is created for a paid course. Signatures are verified
 * against the raw body before any parsing of trust; the event id is the idempotency key, and the
 * order/ledger/enrolment writes share one transaction in `fulfillCheckoutSession`.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "PAYMENTS_UNAVAILABLE" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (signature === null) {
    return NextResponse.json({ error: "MISSING_SIGNATURE" }, { status: 400 });
  }

  const rawBody = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripeForWebhook().webhooks.constructEvent(rawBody, signature, webhookSecret());
  } catch (error) {
    logger.warn({ err: error }, "stripe webhook signature rejected");
    return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const orderId = session.metadata?.orderId;
      if (typeof orderId !== "string" || orderId === "") {
        await recordWebhookEvent(event.id, event.type);
        return NextResponse.json({ received: true });
      }
      const paymentIntent =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent?.id ?? null);
      await fulfillCheckoutSession({
        eventId: event.id,
        eventType: event.type,
        orderId,
        amountTotal: session.amount_total,
        currency: session.currency,
        paymentIntentId: paymentIntent,
      }).then(async (result) => {
        if (result.status === "fulfilled" && result.userId !== undefined) {
          await createNotification({
            userId: result.userId,
            type: "PURCHASE_RECEIPT",
            title: { ar: "تم استلام دفعتك", en: "Payment received" },
            body: {
              ar: "الدورات في حسابك وسجل مشترياتك.",
              en: "Your courses are in your account and purchase history.",
            },
            linkPath: "/purchases",
          });
          await sendReceiptEmail(orderId);
        }
      });
    } else if (event.type === "checkout.session.expired") {
      const orderId = event.data.object.metadata?.orderId;
      if (typeof orderId === "string" && orderId !== "") {
        await expireCheckoutSession(orderId);
      }
      await recordWebhookEvent(event.id, event.type);
    } else {
      await recordWebhookEvent(event.id, event.type);
    }
  } catch (error) {
    logger.error({ err: error, eventId: event.id, type: event.type }, "stripe webhook failed");
    return NextResponse.json({ error: "WEBHOOK_FAILED" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
