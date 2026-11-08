import "server-only";

import Stripe from "stripe";

import { env } from "@/env";
import { paymentFailed } from "@/lib/errors";

/**
 * Stripe client (P06-T04).
 *
 * The application boots without keys: the catalog, cart and free enrolment stay usable, and checkout
 * reports a clear, translated "payments unavailable" message. `STRIPE_API_BASE` lets the E2E suite
 * drive the real Stripe SDK against a loopback gateway that signs webhooks exactly like Stripe; it is
 * rejected for non-loopback hosts in production.
 */

let client: Stripe | null = null;
let testClient: Stripe | null = null;

function config(): Stripe.StripeConfig {
  if (env.STRIPE_API_BASE === undefined) return {};
  const url = new URL(env.STRIPE_API_BASE);
  return {
    host: url.hostname,
    port: url.port === "" ? (url.protocol === "https:" ? 443 : 80) : Number(url.port),
    protocol: url.protocol === "https:" ? "https" : "http",
  };
}

/** The app client; never used unless both the secret key and webhook secret exist. */
export function getStripe(): Stripe {
  if (env.STRIPE_SECRET_KEY === undefined) throw paymentFailed("PAYMENTS_UNAVAILABLE");
  client ??= new Stripe(env.STRIPE_SECRET_KEY, config());
  return client;
}

/** Webhook verification uses the same client configuration (test gateway included). */
export function getStripeForWebhook(): Stripe {
  if (env.STRIPE_SECRET_KEY === undefined || env.STRIPE_WEBHOOK_SECRET === undefined) {
    throw paymentFailed("PAYMENTS_UNAVAILABLE");
  }
  testClient ??= new Stripe(env.STRIPE_SECRET_KEY, config());
  return testClient;
}

export function isStripeConfigured(): boolean {
  return env.STRIPE_SECRET_KEY !== undefined && env.STRIPE_WEBHOOK_SECRET !== undefined;
}

export function webhookSecret(): string {
  if (env.STRIPE_WEBHOOK_SECRET === undefined) throw paymentFailed("PAYMENTS_UNAVAILABLE");
  return env.STRIPE_WEBHOOK_SECRET;
}
