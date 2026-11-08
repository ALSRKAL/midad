import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { instructorShareCents } from "@/lib/earnings-rules";
import { conflict, internal, paymentFailed } from "@/lib/errors";
import { logger } from "@/server/logger";
import { db } from "@/server/db";
import { env } from "@/env";
import { siteConfig } from "@/config/site";
import { getPlatformSettings } from "@/server/platform-settings";
import { getStripe } from "@/server/stripe";
import type { SessionUser } from "@/server/session";
import { getCartView } from "@/server/cart";

/**
 * Checkout orchestration (P06-T04, BR-06, BR-08, BR-09).
 *
 * Prices are recomputed from the database cart immediately before the Stripe session is created;
 * the client sends only a locale. The order and its lines are frozen in the database with the
 * commission snapshot, and enrolment happens later, only in the signed webhook transaction.
 */

export type StartCheckoutResult = { orderId: string; url: string };

const CHECKOUT_EXPIRY_SEC = 31 * 60;

export async function startCheckout(
  user: SessionUser,
  locale: "ar" | "en",
): Promise<StartCheckoutResult> {
  const cart = await getCartView(user);
  if (cart.items.length === 0) throw conflict("CART_EMPTY");
  if (cart.pricingError !== null) throw conflict(cart.pricingError);
  if (cart.coupon.status === "INVALID") throw conflict(cart.coupon.reason);
  if (cart.items.some((item) => item.availability !== null)) throw conflict("COURSE_UNAVAILABLE");

  const purchasable = cart.items;
  const settings = await getPlatformSettings();
  const priced = purchasable.map((item, index) => {
    const line = cart.quote.lines[index];
    if (line === undefined) throw internal("Quote line missing");
    return { item, line };
  });

  const created = await db.$transaction(async (tx) => {
    // Re-read the real prices inside the transaction so a concurrent editor cannot make the frozen
    // lines disagree with the total this checkout charges.
    const fresh = await tx.course.findMany({
      where: { id: { in: purchasable.map((item) => item.id) }, status: "PUBLISHED" },
      select: { id: true, priceCents: true },
    });
    if (fresh.length !== purchasable.length) throw conflict("COURSE_UNAVAILABLE");
    const priceById = new Map(fresh.map((row) => [row.id, row.priceCents]));
    for (const item of purchasable) {
      if (priceById.get(item.id) !== item.priceCents) throw conflict("PRICE_CHANGED");
    }

    const order = await tx.order.create({
      data: {
        userId: user.id,
        status: "PENDING",
        currency: cart.quote.currency,
        subtotalCents: cart.quote.subtotalCents,
        discountCents: cart.quote.discountCents,
        taxCents: cart.quote.taxCents,
        totalCents: cart.quote.totalCents,
        vatBps: settings.vatBps,
        ...(cart.coupon.status === "VALID"
          ? { couponId: cart.coupon.couponId, couponCode: cart.coupon.code }
          : {}),
      },
      select: { id: true },
    });

    await tx.orderItem.createMany({
      data: priced.map(({ item, line }) => ({
        orderId: order.id,
        courseId: item.id,
        instructorProfileId: item.instructorProfileId,
        unitPriceCents: line.unitPriceCents,
        discountCents: line.discountCents,
        commissionBps: settings.commissionBps,
        instructorShareCents: instructorShareCents(line.taxableCents, settings.commissionBps),
        titleSnapshot:
          (locale === "en" ? (item.titleEn ?? item.titleAr) : (item.titleAr ?? item.titleEn)) ??
          item.slug,
      })),
    });

    await tx.payment.create({
      data: {
        orderId: order.id,
        provider: "STRIPE",
        status: "PENDING",
        amountCents: cart.quote.totalCents,
        currency: cart.quote.currency,
      },
    });

    return order;
  });

  try {
    const owner = `${siteConfig.name.en} · ${created.id}`;
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      client_reference_id: created.id,
      metadata: { orderId: created.id, userId: user.id },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: cart.quote.currency.toLowerCase(),
            unit_amount: cart.quote.totalCents,
            product_data: { name: owner },
          },
        },
      ],
      success_url: `${env.APP_URL}/${locale}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.APP_URL}/${locale}/checkout/failed?order_id=${created.id}`,
      expires_at: Math.floor(Date.now() / 1000) + CHECKOUT_EXPIRY_SEC,
    });
    if (session.url === null) throw paymentFailed("CHECKOUT_SESSION_WITHOUT_URL");

    await db.order.update({
      where: { id: created.id },
      data: { stripeSessionId: session.id },
    });
    return { orderId: created.id, url: session.url };
  } catch (error) {
    logger.error({ err: error, orderId: created.id }, "stripe checkout session failed");
    await db.$transaction([
      db.order.updateMany({
        where: { id: created.id, status: "PENDING" },
        data: { status: "FAILED" },
      }),
      db.payment.updateMany({
        where: { orderId: created.id, status: "PENDING" },
        data: { status: "FAILED" },
      }),
    ]);
    throw paymentFailed("PAYMENTS_UNAVAILABLE");
  }
}

export type FulfillmentInput = {
  eventId: string;
  eventType: string;
  orderId: string;
  amountTotal: number | null;
  currency: string | null;
  paymentIntentId: string | null;
};

export type FulfillmentResult = {
  status: "fulfilled" | "duplicate" | "ignored";
  orderId: string | null;
  userId?: string;
};

/**
 * Fulfils one paid Checkout session (BR-08). The processed-event row, order transition, enrolments,
 * coupon redemption, payment, ledger and cart cleanup are one transaction: either every effect
 * exists once, or none does and Stripe retries.
 */
export async function fulfillCheckoutSession(input: FulfillmentInput): Promise<FulfillmentResult> {
  try {
    return await db.$transaction(async (tx) => {
      await tx.processedWebhookEvent.create({
        data: { id: input.eventId, type: input.eventType },
      });

      const order = await tx.order.findUnique({
        where: { id: input.orderId },
        select: {
          id: true,
          userId: true,
          status: true,
          currency: true,
          totalCents: true,
          discountCents: true,
          couponId: true,
          items: {
            select: {
              courseId: true,
              instructorProfileId: true,
              instructorShareCents: true,
            },
          },
        },
      });
      if (order === null) return { status: "ignored" as const, orderId: null };

      if (
        input.amountTotal !== null &&
        (input.amountTotal !== order.totalCents ||
          (input.currency ?? "").toUpperCase() !== order.currency.toUpperCase())
      ) {
        throw paymentFailed("AMOUNT_MISMATCH");
      }

      if (order.status === "PAID") {
        return { status: "duplicate" as const, orderId: order.id, userId: order.userId };
      }

      const updated = await tx.order.updateMany({
        where: { id: order.id, status: "PENDING" },
        data: { status: "PAID", paidAt: new Date() },
      });
      if (updated.count === 0) {
        return { status: "duplicate" as const, orderId: order.id, userId: order.userId };
      }

      for (const item of order.items) {
        const existing = await tx.enrollment.findUnique({
          where: { userId_courseId: { userId: order.userId, courseId: item.courseId } },
          select: { id: true, status: true },
        });
        if (existing === null) {
          await tx.enrollment.create({
            data: {
              userId: order.userId,
              courseId: item.courseId,
              orderId: order.id,
              source: "PURCHASE",
              status: "ACTIVE",
            },
          });
          await tx.course.update({
            where: { id: item.courseId },
            data: { studentsCount: { increment: 1 } },
          });
        } else if (existing.status === "REVOKED") {
          await tx.enrollment.update({
            where: { id: existing.id },
            data: { status: "ACTIVE", orderId: order.id, revokedAt: null },
          });
          await tx.course.update({
            where: { id: item.courseId },
            data: { studentsCount: { increment: 1 } },
          });
        }
      }

      if (order.couponId !== null && order.discountCents > 0) {
        // Serialise redemptions for this coupon. A paid buyer is never denied their price; only the
        // redemption row is skipped when the cap was already reached by a concurrent payment.
        await tx.$queryRaw`SELECT id FROM coupons WHERE id = ${order.couponId} FOR UPDATE`;
        const coupon = await tx.coupon.findUnique({
          where: { id: order.couponId },
          select: { maxRedemptions: true, maxPerUser: true },
        });
        if (coupon !== null) {
          const [globalCount, userCount] = await Promise.all([
            tx.couponRedemption.count({ where: { couponId: order.couponId } }),
            tx.couponRedemption.count({
              where: { couponId: order.couponId, userId: order.userId },
            }),
          ]);
          const globalAllowed =
            coupon.maxRedemptions === null || globalCount < coupon.maxRedemptions;
          if (globalAllowed && userCount < coupon.maxPerUser) {
            await tx.couponRedemption.create({
              data: {
                couponId: order.couponId,
                userId: order.userId,
                orderId: order.id,
                amountOffCents: order.discountCents,
              },
            });
          } else {
            logger.warn(
              { couponId: order.couponId, orderId: order.id },
              "coupon redemption cap reached at fulfilment; price honoured, redemption skipped",
            );
          }
        }
      }

      await tx.payment.update({
        where: { orderId: order.id },
        data: {
          status: "SUCCEEDED",
          stripeEventId: input.eventId,
          ...(input.paymentIntentId === null
            ? {}
            : { stripePaymentIntentId: input.paymentIntentId }),
        },
      });

      for (const item of order.items) {
        await tx.ledgerEntry.create({
          data: {
            instructorProfileId: item.instructorProfileId,
            type: "SALE",
            amountCents: item.instructorShareCents,
            currency: order.currency,
            orderId: order.id,
            description: "Course sale",
          },
        });
      }

      await tx.cartItem.deleteMany({
        where: { userId: order.userId, courseId: { in: order.items.map((item) => item.courseId) } },
      });

      return { status: "fulfilled" as const, orderId: order.id, userId: order.userId };
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { status: "duplicate", orderId: input.orderId };
    }
    throw error;
  }
}

/** Records any other event id so Stripe retries do not reprocess it. */
export async function recordWebhookEvent(eventId: string, eventType: string): Promise<void> {
  try {
    await db.processedWebhookEvent.create({ data: { id: eventId, type: eventType } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return;
    throw error;
  }
}

/** Marks an abandoned Checkout session's pending order as cancelled. */
export async function expireCheckoutSession(orderId: string): Promise<void> {
  await db.$transaction([
    db.order.updateMany({
      where: { id: orderId, status: "PENDING" },
      data: { status: "CANCELLED" },
    }),
    db.payment.updateMany({
      where: { orderId, status: "PENDING" },
      data: { status: "FAILED" },
    }),
  ]);
}

export type CheckoutOrderView = {
  id: string;
  status: "PENDING" | "PAID" | "FAILED" | "CANCELLED" | "REFUNDED" | "PARTIALLY_REFUNDED";
  totalCents: number;
  currency: string;
  createdAt: Date;
  paidAt: Date | null;
  items: Array<{ courseId: string; title: string; slug: string }>;
};

/** Polling source for the success page; scoped to the signed-in owner (or an admin). */
export async function getCheckoutOrder(
  userId: string,
  sessionId: string,
): Promise<CheckoutOrderView | null> {
  const order = await db.order.findFirst({
    where: { stripeSessionId: sessionId, userId },
    select: {
      id: true,
      status: true,
      totalCents: true,
      currency: true,
      createdAt: true,
      paidAt: true,
      items: {
        select: {
          courseId: true,
          titleSnapshot: true,
          course: { select: { slug: true } },
        },
      },
    },
  });
  if (order === null) return null;
  return {
    ...order,
    status: order.status,
    items: order.items.map((item) => ({
      courseId: item.courseId,
      title: item.titleSnapshot,
      slug: item.course.slug,
    })),
  };
}

/** Used by the failure page to show the amount that was not charged. */
export async function getOrderForUser(userId: string, orderId: string) {
  return db.order.findFirst({
    where: { id: orderId, userId },
    select: { id: true, status: true, totalCents: true, currency: true },
  });
}
