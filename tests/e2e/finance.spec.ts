import { expect, test, type Page } from "@playwright/test";

import { fixture, type FixtureOrder, type FixtureUser } from "./helpers/fixtures";

/**
 * Finance journeys (P10): analytics ranges, payout request → admin payment, refund request → Stripe
 * execution and ledger reversal, report moderation, settings and maintenance mode.
 *
 * Every project provisions its own instructor, buyer, order and report through the test-only
 * fixture API; the settings check is safe because projects run serially (P14-T01).
 */

type PayoutFixture = FixtureUser & { profileId: string; orderId: string };
type ReportFixture = FixtureUser & { reportId: string; reason: string };

const ADMIN = "admin@midad.test";
let PASSWORD = "";
let payoutInstructor: PayoutFixture;
let refundBuyer: FixtureOrder;
let report: ReportFixture;

test.beforeAll(async () => {
  payoutInstructor = await fixture<PayoutFixture>("/payout");
  refundBuyer = await fixture<FixtureOrder>("/refundable", {
    courseSlug: "modern-react-app-development",
    progressPct: 0,
  });
  report = await fixture<ReportFixture>("/report");
  PASSWORD = payoutInstructor.password;
});

test.describe.configure({ mode: "serial" });

async function signIn(page: Page, email: string): Promise<void> {
  await page.goto("/ar/login");
  await page.getByLabel("البريد الإلكتروني").fill(email);
  await page.getByLabel("كلمة المرور").fill(PASSWORD);
  await page.getByRole("button", { name: "دخول" }).click();
  await page.waitForURL(/\/ar$/, { timeout: 20_000 });
  // The sign-in redirect and the shell's refresh can overlap; let the document settle before the
  // next navigation or Chromium reports NS_BINDING_ABORTED (P15-T01 zero-flaky).
  await page.waitForLoadState("networkidle");
}

/** Retries a document request aborted by a redirect that is still settling. */
async function gotoStable(page: Page, url: string): Promise<void> {
  try {
    await page.goto(url, { waitUntil: "networkidle" });
  } catch (error) {
    if (!/interrupted by another navigation|NS_BINDING_ABORTED/i.test(String(error))) throw error;
    await page.goto(url, { waitUntil: "networkidle" });
  }
}

async function signOut(page: Page): Promise<void> {
  await page.context().clearCookies();
}

test("the instructor sees analytics ranges and requests a payout", async ({ page }) => {
  await signIn(page, payoutInstructor.email);
  await page.goto("/ar/instructor", { waitUntil: "networkidle" });

  await expect(page.getByRole("heading", { name: "تحليلات الأداء" })).toBeVisible();
  await expect(page.getByText("الإيرادات اليومية")).toBeVisible();
  await expect(page.getByText("الطلاب الجدد يوميًا")).toBeVisible();

  await page.getByRole("link", { name: "90 يومًا" }).click();
  await page.waitForURL(/range=90/);
  await expect(page.getByRole("link", { name: "90 يومًا" })).toHaveAttribute(
    "aria-current",
    "page",
  );

  await page.goto("/ar/instructor/earnings", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "الأرباح" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "كشف الحساب" })).toBeVisible();
  await page.locator("#payout-amount").fill("100");
  await page.getByRole("button", { name: "أرسل طلب السحب" }).click();
  await expect(page.getByText("أُرسل طلب السحب إلى الإدارة.")).toBeVisible();
  await expect(page.getByText("قيد المراجعة").first()).toBeVisible();
});

test("the admin marks the payout paid and the instructor sees the reference", async ({ page }) => {
  await signIn(page, ADMIN);
  await page.goto(`/ar/admin/payouts?q=${encodeURIComponent(payoutInstructor.email)}`, {
    waitUntil: "networkidle",
  });
  await page.getByRole("link", { name: "مراجعة السحب" }).first().click();
  await page.locator("#payout-reference").fill("TRX-E2E-2026");
  await page.getByRole("button", { name: "علّم كمدفوع" }).click();
  await expect(page.getByText("عُلّم السحب كمدفوع وقُيّد في الدفتر.")).toBeVisible();

  await signOut(page);
  await signIn(page, payoutInstructor.email);
  await page.goto("/ar/instructor/earnings", { waitUntil: "networkidle" });
  await expect(page.getByText("TRX-E2E-2026")).toBeVisible();
  await expect(page.getByText("مدفوع").first()).toBeVisible();
});

test("a refund request is executed by Stripe and reverses the ledger", async ({ page }) => {
  await signIn(page, refundBuyer.email);
  await gotoStable(page, "/ar/purchases");
  await page.getByRole("button", { name: "طلب استرداد" }).first().click();
  await page
    .locator('textarea[id^="refund-reason-"]')
    .fill("لم أتمكن من متابعة الدورة بسبب تغيّر جدولي، وأطلب استرداد المبلغ.");
  await page.getByRole("button", { name: "أرسل الطلب" }).click();
  await expect(page.getByText("أُرسل طلب الاسترداد إلى الإدارة.")).toBeVisible();

  await signOut(page);
  await signIn(page, ADMIN);
  await page.goto(`/ar/admin/refunds?q=${encodeURIComponent(refundBuyer.email)}`, {
    waitUntil: "networkidle",
  });
  await page.getByRole("link", { name: "مراجعة الاسترداد" }).first().click();
  await page.locator("#refund-decision-note").fill("موافقة اختبار آلية.");
  await page.getByRole("button", { name: "وافق ونفّذ الاسترداد" }).click();
  await expect(page.getByText("نُفّذ الاسترداد وأُلغي الوصول.")).toBeVisible({ timeout: 20_000 });

  await signOut(page);
  await signIn(page, refundBuyer.email);
  await gotoStable(page, "/ar/purchases");
  await expect(page.getByText("حالة الاسترداد: مكتمل")).toBeVisible();
  await expect(page.getByRole("button", { name: "طلب استرداد" })).toHaveCount(0);
});

test("the admin resolves a report and reads the finance tables", async ({ page }) => {
  await signIn(page, ADMIN);
  await page.goto(`/ar/admin/reports?q=${encodeURIComponent(report.reason)}`, {
    waitUntil: "networkidle",
  });
  await page.getByRole("button", { name: "حل", exact: true }).first().click();
  await expect(page.locator("tbody").getByText("محلول").first()).toBeVisible();

  await page.goto("/ar/admin/orders", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "الطلبات" })).toBeVisible();
  await expect(page.getByText(refundBuyer.orderId).first()).toBeVisible();

  await page.goto("/ar/admin/messages", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "رسائل التواصل" })).toBeVisible();
  // The inbox may be empty on a freshly seeded database; the table shell and CSV link must exist.
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page.getByRole("link", { name: "تصدير CSV" })).toHaveAttribute(
    "href",
    /^\/api\/admin\/contact\/export/,
  );
});

test("settings save and maintenance mode redirects visitors until disabled", async ({ page }) => {
  await signIn(page, ADMIN);
  await page.goto("/ar/admin/settings", { waitUntil: "networkidle" });

  const vat = page.locator("#setting-vat");
  await vat.fill("16");
  await page.getByRole("button", { name: "احفظ الإعدادات" }).click();
  await expect(page.getByText("حُفظت الإعدادات.")).toBeVisible();
  await vat.fill("15");
  await page.getByRole("button", { name: "احفظ الإعدادات" }).click();
  await expect(page.getByText("حُفظت الإعدادات.")).toBeVisible();

  const maintenance = page.getByRole("checkbox");
  await maintenance.check();
  await page.getByRole("button", { name: "احفظ الإعدادات" }).click();
  await expect(page.getByText("حُفظت الإعدادات.")).toBeVisible();

  // Middleware caches the flag for five seconds per isolate.
  await page.waitForTimeout(6000);
  await page.goto("/ar");
  await page.waitForURL(/\/ar\/maintenance/);
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  try {
    await page.goto("/ar/admin/settings", { waitUntil: "networkidle" });
  } catch (error) {
    // The maintenance redirect can still be settling; retry the document request.
    if (!/interrupted by another navigation|NS_BINDING_ABORTED/i.test(String(error))) throw error;
    await page.goto("/ar/admin/settings", { waitUntil: "networkidle" });
  }
  await maintenance.uncheck();
  await page.getByRole("button", { name: "احفظ الإعدادات" }).click();
  await expect(page.getByText("حُفظت الإعدادات.")).toBeVisible();
  await page.waitForTimeout(6000);
  await page.goto("/ar");
  await expect(page).toHaveURL(/\/ar$/);
});
