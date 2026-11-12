#!/usr/bin/env node
/**
 * Loopback Stripe gateway for the E2E suite.
 *
 * It implements only the two surfaces the app uses: `POST /v1/checkout/sessions` for the real Stripe
 * SDK, and a tiny hosted page that emits a genuinely signed `checkout.session.completed` webhook.
 * The application verifies that signature with the Stripe SDK exactly as it does in production; only
 * the network destination changes. Never start this in production.
 */

import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

import Stripe from "stripe";

const PORT = Number(process.env.STRIPE_MOCK_PORT ?? 3200);
const WEBHOOK_URL =
  process.env.STRIPE_MOCK_WEBHOOK_URL ?? "http://127.0.0.1:3100/api/webhooks/stripe";
const SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!SECRET || !SECRET_KEY) {
  throw new Error("STRIPE_WEBHOOK_SECRET and STRIPE_SECRET_KEY are required for the mock gateway");
}
const stripe = new Stripe(SECRET_KEY);
const sessions = new Map();

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
  });
}

function json(response, status, body) {
  response.writeHead(status, {
    "content-type": "application/json",
    "request-id": `req_mock_${randomUUID()}`,
  });
  response.end(JSON.stringify(body));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function amountLabel(amount, currency) {
  return `${(Number(amount) / 100).toFixed(2)} ${String(currency).toUpperCase()}`;
}

function page(session) {
  return `<!doctype html>
<html lang="en" dir="ltr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Test payment</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; background: #f6f4ef; color: #231f1a; }
    main { max-width: 28rem; margin: 5rem auto; background: #fff; padding: 2rem; border-radius: .75rem; box-shadow: 0 10px 30px rgb(0 0 0 / .08); }
    h1 { margin: 0 0 .25rem; font-size: 1.25rem; }
    p { color: #5c554d; line-height: 1.6; }
    button { width: 100%; padding: .8rem 1rem; border: 0; border-radius: .5rem; font: inherit; font-weight: 600; cursor: pointer; }
    .pay { background: #14532d; color: #fff; margin-top: 1.5rem; }
    .cancel { background: #ece8e1; color: #231f1a; margin-top: .6rem; }
    code { font-size: .8rem; word-break: break-all; }
  </style>
</head>
<body>
  <main>
    <h1>Midad test gateway</h1>
    <p>This page replaces Stripe Checkout only in the automated test environment. It signs a real webhook with the configured test secret.</p>
    <p><strong>${escapeHtml(amountLabel(session.amount_total, session.currency))}</strong><br/>
    <code>${escapeHtml(session.id)}</code></p>
    <form method="post" action="/pay/${encodeURIComponent(session.id)}">
      <button class="pay" type="submit">Pay ${escapeHtml(amountLabel(session.amount_total, session.currency))}</button>
    </form>
    <form method="post" action="/3ds/${encodeURIComponent(session.id)}">
      <button class="pay" type="submit">Pay with 3-D Secure</button>
    </form>
    <form method="post" action="/decline/${encodeURIComponent(session.id)}">
      <button class="cancel" type="submit">Decline card</button>
    </form>
    <form method="post" action="/cancel/${encodeURIComponent(session.id)}">
      <button class="cancel" type="submit">Cancel payment</button>
    </form>
  </main>
</body>
</html>`;
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://127.0.0.1:${PORT}`);

  // Refund execution (P10-T03) is the only other Stripe surface the admin flow needs. The real SDK
  // posts form-encoded fields and expects a refund object; the payment intent was created above.
  if (request.method === "POST" && url.pathname === "/v1/refunds") {
    const form = new URLSearchParams(await readBody(request));
    const id = `re_test_${randomUUID().replaceAll("-", "").slice(0, 20)}`;
    const refund = {
      id,
      object: "refund",
      status: "succeeded",
      amount: Number(form.get("amount") ?? 0),
      currency: form.get("currency") ?? "sar",
      payment_intent: form.get("payment_intent") ?? "",
      reason: form.get("reason") ?? null,
      metadata: {},
      created: Math.floor(Date.now() / 1000),
    };
    console.log(`[stripe-mock] refund ${id} for ${refund.payment_intent}`);
    json(response, 200, refund);
    return;
  }

  if (request.method === "POST" && url.pathname === "/v1/checkout/sessions") {
    const form = new URLSearchParams(await readBody(request));
    const id = `cs_test_${randomUUID().replaceAll("-", "").slice(0, 24)}`;
    const session = {
      id,
      object: "checkout.session",
      mode: "payment",
      status: "open",
      payment_status: "unpaid",
      livemode: false,
      currency: form.get("line_items[0][price_data][currency]") ?? "sar",
      amount_total: Number(form.get("line_items[0][price_data][unit_amount]") ?? 0),
      metadata: {
        orderId: form.get("metadata[orderId]") ?? "",
        userId: form.get("metadata[userId]") ?? "",
      },
      success_url: form.get("success_url") ?? "",
      cancel_url: form.get("cancel_url") ?? "",
      customer_email: form.get("customer_email"),
      client_reference_id: form.get("client_reference_id"),
      expires_at: Number(form.get("expires_at") ?? 0),
    };
    sessions.set(id, session);
    console.log(`[stripe-mock] session ${id} for order ${session.metadata.orderId}`);
    json(response, 200, { ...session, url: `http://127.0.0.1:${PORT}/pay/${id}` });
    return;
  }

  const payMatch = url.pathname.match(/^\/pay\/(cs_test_[A-Za-z0-9]+)$/);
  if (request.method === "GET" && payMatch?.[1]) {
    const session = sessions.get(payMatch[1]);
    if (session === undefined) {
      response.writeHead(404, { "content-type": "text/plain" });
      response.end("Unknown session");
      return;
    }
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(page(session));
    return;
  }

  const threeDsMatch = url.pathname.match(/^\/3ds\/(cs_test_[A-Za-z0-9]+)$/);
  if (request.method === "POST" && threeDsMatch?.[1]) {
    const session = sessions.get(threeDsMatch[1]);
    if (session === undefined) {
      response.writeHead(404, { "content-type": "text/plain" });
      response.end("Unknown session");
      return;
    }
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(`<!doctype html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>3-D Secure</title></head>
<body style="font-family: system-ui, sans-serif; background: #f6f4ef; color: #231f1a;">
<main style="max-width:28rem;margin:5rem auto;background:#fff;padding:2rem;border-radius:.75rem;">
<h1>3-D Secure authentication</h1>
<p>Your bank asks you to confirm this test payment.</p>
<form method="post" action="/pay/${encodeURIComponent(session.id)}">
<button style="width:100%;padding:.8rem;border:0;border-radius:.5rem;background:#14532d;color:#fff;font:inherit;font-weight:600;cursor:pointer;" type="submit">Authenticate payment</button>
</form>
</main></body></html>`);
    return;
  }

  if (request.method === "POST" && payMatch?.[1]) {
    const session = sessions.get(payMatch[1]);
    if (session === undefined) {
      response.writeHead(404, { "content-type": "text/plain" });
      response.end("Unknown session");
      return;
    }
    const event = {
      id: `evt_test_${randomUUID().replaceAll("-", "").slice(0, 20)}`,
      object: "event",
      type: "checkout.session.completed",
      created: Math.floor(Date.now() / 1000),
      livemode: false,
      data: {
        object: {
          ...session,
          status: "complete",
          payment_status: "paid",
          payment_intent: `pi_test_${randomUUID().replaceAll("-", "").slice(0, 20)}`,
        },
      },
    };
    const payload = JSON.stringify(event);
    const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: SECRET });
    try {
      const delivery = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "content-type": "application/json", "stripe-signature": signature },
        body: payload,
      });
      console.log(`[stripe-mock] webhook ${event.id} -> ${delivery.status}`);
      if (!delivery.ok) {
        response.writeHead(502, { "content-type": "text/plain" });
        response.end("The application rejected the webhook");
        return;
      }
    } catch (error) {
      console.error("[stripe-mock] webhook delivery failed", error);
      response.writeHead(502, { "content-type": "text/plain" });
      response.end("Could not reach the application");
      return;
    }

    response.writeHead(303, {
      location: session.success_url.replace("{CHECKOUT_SESSION_ID}", session.id),
    });
    response.end();
    return;
  }

  const declineMatch = url.pathname.match(/^\/decline\/(cs_test_[A-Za-z0-9]+)$/);
  if (request.method === "POST" && declineMatch?.[1]) {
    const session = sessions.get(declineMatch[1]);
    if (session === undefined) {
      response.writeHead(404, { "content-type": "text/plain" });
      response.end("Unknown session");
      return;
    }
    const events = [
      {
        id: `evt_test_${randomUUID().replaceAll("-", "").slice(0, 20)}`,
        object: "event",
        type: "payment_intent.payment_failed",
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        data: {
          object: {
            id: `pi_test_${randomUUID().replaceAll("-", "").slice(0, 20)}`,
            object: "payment_intent",
            status: "requires_payment_method",
            metadata: session.metadata,
          },
        },
      },
      {
        id: `evt_test_${randomUUID().replaceAll("-", "").slice(0, 20)}`,
        object: "event",
        type: "checkout.session.expired",
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        data: { object: { ...session, status: "expired" } },
      },
    ];
    for (const event of events) {
      const payload = JSON.stringify(event);
      const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: SECRET });
      try {
        const delivery = await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: { "content-type": "application/json", "stripe-signature": signature },
          body: payload,
        });
        console.log(`[stripe-mock] decline ${event.type} -> ${delivery.status}`);
      } catch (error) {
        console.error("[stripe-mock] decline event delivery failed", error);
      }
    }
    response.writeHead(303, { location: session.cancel_url });
    response.end();
    return;
  }

  const cancelMatch = url.pathname.match(/^\/cancel\/(cs_test_[A-Za-z0-9]+)$/);
  if (request.method === "POST" && cancelMatch?.[1]) {
    const session = sessions.get(cancelMatch[1]);
    if (session === undefined) {
      response.writeHead(404, { "content-type": "text/plain" });
      response.end("Unknown session");
      return;
    }
    // A real Stripe Checkout cancellation eventually emits checkout.session.expired. Emit it now
    // so the suite proves the order transitions to CANCELLED instead of lingering as PENDING.
    const event = {
      id: `evt_test_${randomUUID().replaceAll("-", "").slice(0, 20)}`,
      object: "event",
      type: "checkout.session.expired",
      created: Math.floor(Date.now() / 1000),
      livemode: false,
      data: { object: { ...session, status: "expired" } },
    };
    const payload = JSON.stringify(event);
    const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: SECRET });
    try {
      await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "content-type": "application/json", "stripe-signature": signature },
        body: payload,
      });
    } catch (error) {
      console.error("[stripe-mock] expired-event delivery failed", error);
    }
    response.writeHead(303, { location: session.cancel_url });
    response.end();
    return;
  }

  response.writeHead(404, { "content-type": "text/plain" });
  response.end("Not found");
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[stripe-mock] listening on http://127.0.0.1:${PORT}`);
});
