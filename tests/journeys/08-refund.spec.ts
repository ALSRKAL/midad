import { expect, test, type Page } from "@playwright/test";

import { fixture, type FixtureOrder } from "../e2e/helpers/fixtures";
import { copy, gotoStable, PASSWORD, reloadStable } from "./helpers";

/** Firefox can reset a keep-alive API connection between role switches; retry the sign-in. */
async function signInApi(page: Page, email: string, password: string): Promise<void> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await page.request.post("/api/auth/sign-in/email", {
        headers: { origin: "http://127.0.0.1:3100" },
        data: { email, password },
      });
      if (response.ok()) return;
      lastError = new Error(`sign-in failed with ${response.status()}`);
    } catch (error) {
      lastError = error;
    }
    await page.waitForTimeout(300);
  }
  throw lastError instanceof Error ? lastError : new Error("sign-in failed");
}

/**
 * Journey 8 (§13.3): a refund request is approved, the Stripe refund executes and access is revoked
 * immediately. A second order above 30% progress cannot even be submitted and shows the reason.
 */

for (const locale of ["ar", "en"] as const) {
  test(`refund approval and the 30% refusal in ${locale}`, async ({ page }) => {
    const refundable = await fixture<FixtureOrder>("/refundable", { progressPct: 0 });
    const progressed = await fixture<FixtureOrder>("/refundable", {
      courseSlug: "frontend-design-foundations",
      progressPct: 45,
    });

    await signInApi(page, refundable.email, refundable.password);
    await gotoStable(page, `/${locale}/purchases`);
    await page
      .getByRole("button", { name: copy(locale, "طلب استرداد", "Request a refund") })
      .first()
      .click();
    await page
      .locator('textarea[id^="refund-reason-"]')
      .fill(
        locale === "ar"
          ? "لم أتمكن من متابعة الدورة بسبب تغيّر جدولي، وأطلب استرداد المبلغ."
          : "I could not continue the course because my schedule changed, so I am requesting a refund.",
      );
    await page.getByRole("button", { name: copy(locale, "أرسل الطلب", "Send request") }).click();
    // The confirmation sentence is transient; the refund status is the durable proof that the
    // request exists. Some engines drop the follow-up refresh, so reload once if needed.
    const pending = page.getByText(copy(locale, "قيد المراجعة", "Requested")).first();
    const appeared = await pending
      .waitFor({ state: "visible", timeout: 10_000 })
      .then(() => true)
      .catch(() => false);
    if (!appeared) await reloadStable(page);
    await expect(pending).toBeVisible({ timeout: 30_000 });

    await page.context().clearCookies();
    await signInApi(page, "admin@midad.test", PASSWORD);
    await gotoStable(page, `/${locale}/admin/refunds?q=${encodeURIComponent(refundable.email)}`);
    const refundHref = await page
      .getByRole("link", { name: copy(locale, "مراجعة الاسترداد", "Review refund") })
      .first()
      .getAttribute("href");
    expect(refundHref).not.toBeNull();
    await gotoStable(page, refundHref ?? "");
    await page
      .locator("#refund-decision-note")
      .fill(copy(locale, "موافقة اختبار آلية.", "Automated approval."));
    await page
      .getByRole("button", {
        name: copy(locale, "وافق ونفّذ الاسترداد", "Approve and execute refund"),
      })
      .click();
    // The inline confirmation is transient; the durable state is the completed refund status.
    await expect(page.getByText(copy(locale, "مكتمل", "Completed")).first()).toBeVisible({
      timeout: 20_000,
    });

    await page.context().clearCookies();
    await signInApi(page, refundable.email, refundable.password);
    await gotoStable(page, `/${locale}/purchases`);
    await expect(
      page.getByText(copy(locale, "حالة الاسترداد: مكتمل", "Refund status: completed")),
    ).toBeVisible();

    await page.context().clearCookies();
    await signInApi(page, progressed.email, progressed.password);
    await gotoStable(page, `/${locale}/purchases`);
    await expect(
      page.getByText(
        copy(
          locale,
          "لا يمكن الاسترداد بعد تجاوز 30% من الدورة.",
          "Refunds are unavailable after 30% course progress.",
        ),
      ),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: copy(locale, "طلب استرداد", "Request a refund") }),
    ).toHaveCount(0);
  });
}
