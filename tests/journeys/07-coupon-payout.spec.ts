import { expect, test } from "@playwright/test";

import { fixture, type FixtureUser } from "../e2e/helpers/fixtures";
import { copy, gotoStable, PASSWORD, unique } from "./helpers";

/**
 * Journey 7 (§13.3): the instructor creates a coupon, sees one sale still pending and an older sale
 * available, requests a payout, and the admin marks it paid with a transfer reference.
 */

type PayoutInstructor = FixtureUser & {
  profileId: string;
  orderId: string;
  pendingOrderId: string;
};

for (const locale of ["ar", "en"] as const) {
  test(`coupon, earnings and payout in ${locale}`, async ({ page }) => {
    const instructor = await fixture<PayoutInstructor>("/payout");
    const courseTitle = copy(locale, "دورة السحب E2E", "Payout fixture course");
    const couponCode = `J7${unique("c").replaceAll("-", "").toUpperCase().slice(0, 10)}`;

    const signIn = await page.request.post("/api/auth/sign-in/email", {
      headers: { origin: "http://127.0.0.1:3100" },
      data: { email: instructor.email, password: instructor.password },
    });
    expect(signIn.ok()).toBe(true);

    await gotoStable(page, `/${locale}/instructor/coupons`);
    await expect(
      page.getByRole("heading", {
        name: copy(locale, "كوبونات الخصم", "Discount coupons"),
        level: 2,
      }),
    ).toBeVisible();
    await page.locator("#coupon-new-code").fill(couponCode);
    await page.locator("#coupon-new-percentage").fill("15");
    await page.locator("#coupon-new-course").selectOption({ label: courseTitle });
    await page.locator("#coupon-new-starts").fill("2026-01-01T00:00");
    await page.locator("#coupon-new-ends").fill("2030-12-31T23:59");
    await page.locator("#coupon-new-max").fill("25");
    await page.locator("#coupon-new-per-user").fill("1");
    await page.getByRole("button", { name: copy(locale, "أنشئ الكوبون", "Create coupon") }).click();
    await expect(
      page.getByText(
        copy(
          locale,
          "أُنشئ الكوبون وأصبح ظاهرًا في القائمة.",
          "Coupon created and added to the list.",
        ),
      ),
    ).toBeVisible();
    await expect(page.locator("tbody tr").filter({ hasText: couponCode })).toBeVisible();

    await gotoStable(page, `/${locale}/instructor/earnings`);
    await expect(
      page.getByRole("heading", { name: copy(locale, "الأرباح", "Earnings") }),
    ).toBeVisible();
    await expect(
      page.getByText(copy(locale, "الرصيد المتاح", "Available balance"), { exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByText(copy(locale, "أرباح مؤهلة", "Eligible earnings"), { exact: true }).first(),
    ).toBeVisible();

    await page.locator("#payout-amount").fill("100");
    await page
      .getByRole("button", { name: copy(locale, "أرسل طلب السحب", "Send payout request") })
      .click();
    await expect(
      page.getByText(
        copy(locale, "أُرسل طلب السحب إلى الإدارة.", "Your payout request was sent to the admin."),
      ),
    ).toBeVisible();
    await expect(page.getByText(copy(locale, "قيد المراجعة", "Requested")).first()).toBeVisible();

    await page.context().clearCookies();
    await page.request.post("/api/auth/sign-in/email", {
      headers: { origin: "http://127.0.0.1:3100" },
      data: { email: "admin@midad.test", password: PASSWORD },
    });
    await gotoStable(page, `/${locale}/admin/payouts?q=${encodeURIComponent(instructor.email)}`);
    // Load the detail document directly: a client-side link navigation keeps the root
    // data-hydrated flag from the previous page, so it is not a hydration signal for the panel.
    const payoutHref = await page
      .getByRole("link", { name: copy(locale, "مراجعة السحب", "Review payout") })
      .first()
      .getAttribute("href");
    expect(payoutHref).not.toBeNull();
    await gotoStable(page, payoutHref ?? "");
    await page.locator("#payout-reference").fill("TRX-JOURNEY-7");
    await page.getByRole("button", { name: copy(locale, "علّم كمدفوع", "Mark as paid") }).click();
    // The inline confirmation is transient; the durable panel state is the payout status plus the
    // transfer reference. Asserting those is stronger than catching a toast before it re-renders.
    await expect(page.getByText(copy(locale, "مدفوع", "Paid")).first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText("TRX-JOURNEY-7").first()).toBeVisible();

    await page.context().clearCookies();
    await page.request.post("/api/auth/sign-in/email", {
      headers: { origin: "http://127.0.0.1:3100" },
      data: { email: instructor.email, password: instructor.password },
    });
    await gotoStable(page, `/${locale}/instructor/earnings`);
    await expect(page.getByText("TRX-JOURNEY-7")).toBeVisible();
    await expect(page.getByText(copy(locale, "مدفوع", "Paid")).first()).toBeVisible();
  });
}
