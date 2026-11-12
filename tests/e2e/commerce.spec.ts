import { expect, test, type Page } from "@playwright/test";

import { fixture, type FixtureUser } from "./helpers/fixtures";

/**
 * Commerce journeys (P06): guest cart merge, coupon, Stripe Checkout through the loopback gateway,
 * signed webhook fulfilment, receipt/invoice, failed payment keeping the cart, and free enrolment.
 *
 * Every Playwright project provisions its own buyer and coupon from the test-only fixture API, so
 * the same journey runs on all engines without sharing mutable seed rows (P14-T01).
 */

const PAID_COURSE = "/ar/courses/data-pipelines-and-orchestration";
const SECOND_COURSE = "/ar/courses/frontend-design-foundations";
const FREE_COURSE = "/ar/courses/arabic-editing-and-proofreading";

let BUYER = "";
let PASSWORD = "";
let COUPON = "";

test.beforeAll(async () => {
  const buyer = await fixture<FixtureUser & { couponCode: string }>("/buyer");
  BUYER = buyer.email;
  PASSWORD = buyer.password;
  COUPON = buyer.couponCode;
});

test.describe.configure({ mode: "serial" });

async function signIn(page: Page): Promise<void> {
  await page.goto("/ar/login");
  await page.getByLabel("البريد الإلكتروني").fill(BUYER);
  await page.getByLabel("كلمة المرور").fill(PASSWORD);
  await page.getByRole("button", { name: "دخول" }).click();
  await page.waitForURL(/\/ar$/, { timeout: 20_000 });
  await page.waitForLoadState("networkidle");
}

/** The post-login redirect can still be settling; retry the interrupted document request. */
async function gotoStable(page: Page, url: string): Promise<void> {
  try {
    await page.goto(url, { waitUntil: "networkidle" });
  } catch (error) {
    if (!/interrupted by another navigation|NS_BINDING_ABORTED/i.test(String(error))) throw error;
    await page.goto(url, { waitUntil: "networkidle" });
  }
}

test("guest cart survives sign-in, applies a coupon, pays and issues an invoice", async ({
  page,
}) => {
  await page.context().clearCookies();
  await gotoStable(page, PAID_COURSE);

  await page.getByRole("button", { name: "أضف إلى السلة" }).click();
  await expect(page.getByRole("button", { name: "في السلة — أزل" })).toBeVisible();
  await page.getByRole("link", { name: "اعرض السلة" }).click();
  await expect(
    page.getByRole("link", { name: "خطوط البيانات والتنسيق بين مهامّها" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "سجّل الدخول لإتمام الدفع" }).click();
  await page.getByLabel("البريد الإلكتروني").fill(BUYER);
  await page.getByLabel("كلمة المرور").fill(PASSWORD);
  await page.getByRole("button", { name: "دخول" }).click();
  await page.waitForURL(/\/ar\/cart$/, { timeout: 20_000 });

  // The guest cookie is deleted only after the merge transaction commits. The shell badge refresh
  // can be lost on Firefox, so wait for the cookie and load the cart document directly (P15-T01).
  await expect
    .poll(
      async () => (await page.context().cookies()).some((cookie) => cookie.name === "midad_cart"),
      { timeout: 30_000 },
    )
    .toBe(false);
  await gotoStable(page, "/ar/cart");
  await expect(page.getByRole("link", { name: "خطوط البيانات والتنسيق بين مهامّها" })).toBeVisible({
    timeout: 30_000,
  });

  await page.getByLabel("كوبون خصم").fill(COUPON.toLowerCase());
  await page.getByRole("button", { name: "طبّق" }).click();
  await expect(page.getByText(`طُبّق الكوبون ${COUPON}`)).toBeVisible();

  await page.getByRole("button", { name: "متابعة الدفع" }).click();
  await page.waitForURL(/127\.0\.0\.1:3200\/pay\//, { timeout: 30_000 });
  await page.getByRole("button", { name: /^Pay \d/ }).click();

  await page.waitForURL(/\/ar\/checkout\/success\?session_id=/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: "تم الدفع، والدورات في حسابك" })).toBeVisible({
    timeout: 20_000,
  });

  // Receipts are queued durably (P09-T03): the worker delivers shortly after fulfilment, so poll
  // rather than assuming the old inline send completed before the success page rendered.
  let receiptDelivered = false;
  for (let attempt = 0; attempt < 15 && !receiptDelivered; attempt += 1) {
    const mailpit = await page.request.get("http://127.0.0.1:8025/api/v1/messages?limit=100");
    expect(mailpit.status()).toBe(200);
    const mailbox = (await mailpit.json()) as {
      messages: Array<{ To: Array<{ Address: string }>; Subject: string }>;
    };
    receiptDelivered = mailbox.messages.some(
      (message) =>
        message.Subject.includes("إيصال الشراء") && message.To.some((to) => to.Address === BUYER),
    );
    if (!receiptDelivered) await page.waitForTimeout(1000);
  }
  expect(receiptDelivered, "purchase receipt email").toBe(true);

  await gotoStable(page, "/ar/purchases");
  await expect(page.getByRole("heading", { name: "سجل المشتريات" })).toBeVisible();
  await expect(page.getByText("خطوط البيانات والتنسيق بين مهامّها")).toBeVisible();

  const invoiceHref = await page
    .getByRole("link", { name: "نزّل الفاتورة (PDF)" })
    .first()
    .getAttribute("href");
  expect(invoiceHref).not.toBeNull();
  const invoice = await page.request.get(invoiceHref ?? "");
  expect(invoice.status()).toBe(200);
  expect(invoice.headers()["content-type"]).toContain("application/pdf");
  const bytes = await invoice.body();
  expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");

  await gotoStable(page, PAID_COURSE);
  await expect(page.getByRole("link", { name: "اذهب إلى الدورة" })).toBeVisible();
  await expect(page.getByRole("button", { name: "أضف إلى السلة" })).toHaveCount(0);
});

test("a cancelled payment keeps the cart and creates no enrolment", async ({ page }) => {
  await signIn(page);
  await gotoStable(page, SECOND_COURSE);
  await page.getByRole("button", { name: "أضف إلى السلة" }).click();
  await expect(page.getByRole("button", { name: "في السلة — أزل" })).toBeVisible();

  await gotoStable(page, "/ar/cart");
  await page.getByRole("button", { name: "متابعة الدفع" }).click();
  await page.waitForURL(/127\.0\.0\.1:3200\/pay\//, { timeout: 30_000 });
  await page.getByRole("button", { name: "Decline card" }).click();

  await page.waitForURL(/\/ar\/checkout\/failed\?order_id=/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: "لم يكتمل الدفع" })).toBeVisible();

  await gotoStable(page, "/ar/cart");
  await expect(
    page.getByRole("link", { name: "أساسيات تصميم الواجهات الأمامية للمطوّرين" }),
  ).toBeVisible();

  await gotoStable(page, SECOND_COURSE);
  await expect(page.getByRole("button", { name: "أضف إلى السلة" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "في السلة — أزل" })).toBeVisible();
});

test("a free course enrols directly and appears in purchase history", async ({ page }) => {
  await signIn(page);
  await gotoStable(page, FREE_COURSE);

  await page.getByRole("button", { name: "سجّل مجانًا" }).click();
  await expect(page.getByRole("link", { name: "اذهب إلى الدورة" })).toBeVisible();

  await gotoStable(page, "/ar/purchases");
  await expect(page.getByRole("heading", { name: "تسجيلات مجانية" })).toBeVisible();
  await expect(
    page.getByText("سجّلت مجانًا في التحرير والتصحيح اللغوي للنصوص العربية"),
  ).toBeVisible();
});

test("the success page never creates an enrolment without the webhook", async ({ page }) => {
  await signIn(page);
  await gotoStable(page, "/ar/cart");
  await page.getByRole("button", { name: "متابعة الدفع" }).click();
  await page.waitForURL(/127\.0\.0\.1:3200\/pay\/(cs_test_[A-Za-z0-9]+)/, { timeout: 30_000 });
  const sessionId = (page.url().match(/\/pay\/(cs_test_[A-Za-z0-9]+)/) ?? [])[1] ?? "";
  expect(sessionId).not.toBe("");

  await gotoStable(page, `/ar/checkout/success?session_id=${sessionId}`);
  await expect(page.getByRole("heading", { name: "نتحقق من الدفع" })).toBeVisible();

  await gotoStable(page, SECOND_COURSE);
  await expect(page.getByRole("link", { name: "اذهب إلى الدورة" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "في السلة — أزل" })).toBeVisible();
});

test("rejects a webhook without a valid Stripe signature", async ({ page }) => {
  const response = await page.request.post("/api/webhooks/stripe", {
    headers: { "content-type": "application/json", "stripe-signature": "t=1,v1=deadbeef" },
    data: { id: "evt_forged", type: "checkout.session.completed" },
  });
  expect(response.status()).toBe(400);
  expect(await response.json()).toEqual({ error: "INVALID_SIGNATURE" });
});
