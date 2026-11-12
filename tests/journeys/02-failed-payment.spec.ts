import { expect, test, type Page } from "@playwright/test";

import { fixture, type FixtureUser } from "../e2e/helpers/fixtures";
import { copy } from "./helpers";

/**
 * Journey 2 (§13.3): a declined card and a 3-D Secure challenge. The declined attempt creates no
 * enrolment and keeps the cart; the challenged attempt only enrols after the authentication step
 * and the signed webhook. The loopback gateway emits the real events.
 */

const COURSE = "frontend-design-foundations";

/**
 * Firefox aborts a navigation that races the router.refresh() triggered by the add-to-cart action.
 * Retrying the same navigation once is the test equivalent of a user clicking again; it does not
 * change the product assertion.
 */
async function gotoStable(
  page: Page,
  url: string,
  options: { waitUntil?: "load" | "domcontentloaded" | "networkidle" | "commit" } = {},
): Promise<void> {
  const gotoOptions = { waitUntil: options.waitUntil ?? "networkidle" };
  try {
    await page.goto(url, gotoOptions);
    await page.waitForSelector("html[data-hydrated=true]", { timeout: 30_000 });
  } catch (error) {
    const message = String(error);
    // NS_ERROR_FAILURE is Firefox's generic navigation failure when the host is saturated; it is
    // a transport failure, not a product response, and one retry is the user's "try again".
    if (
      !message.includes("NS_BINDING_ABORTED") &&
      !message.includes("NS_ERROR_FAILURE") &&
      !message.includes("interrupted by another navigation")
    ) {
      throw error;
    }
    await page.goto(url, gotoOptions);
  }
}

for (const locale of ["ar", "en"] as const) {
  test(`declined payment keeps the cart in ${locale}`, async ({ page }) => {
    const buyer = await fixture<FixtureUser>("/user", { role: "STUDENT" });
    await page.request.post("/api/auth/sign-in/email", {
      headers: { origin: "http://127.0.0.1:3100" },
      data: { email: buyer.email, password: buyer.password },
    });

    await gotoStable(page, `/${locale}/courses/${COURSE}`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: copy(locale, "أضف إلى السلة", "Add to cart") }).click();
    await expect(
      page.getByRole("button", { name: copy(locale, "في السلة — أزل", "In cart — remove") }),
    ).toBeVisible();
    await gotoStable(page, `/${locale}/cart`, { waitUntil: "networkidle" });
    await page
      .getByRole("button", { name: copy(locale, "متابعة الدفع", "Continue to payment") })
      .click();
    await page.waitForURL(/127\.0\.0\.1:3200\/pay\//, { timeout: 30_000 });
    await page.getByRole("button", { name: "Decline card" }).click();

    await page.waitForURL(new RegExp(`/${locale}/checkout/failed\\?order_id=`), {
      timeout: 30_000,
    });
    await expect(
      page.getByRole("heading", {
        name: copy(locale, "لم يكتمل الدفع", "Payment was not completed"),
      }),
    ).toBeVisible();

    await gotoStable(page, `/${locale}/cart`, { waitUntil: "networkidle" });
    await expect(
      page.getByRole("link", {
        name: copy(
          locale,
          "أساسيات تصميم الواجهات الأمامية للمطوّرين",
          "Frontend Design Foundations for Developers",
        ),
      }),
    ).toBeVisible();
    await gotoStable(page, `/${locale}/courses/${COURSE}`, { waitUntil: "networkidle" });
    await expect(
      page.getByRole("link", { name: copy(locale, "اذهب إلى الدورة", "Go to the course") }),
    ).toHaveCount(0);
  });

  test(`3-D Secure payment enrols after authentication in ${locale}`, async ({ page }) => {
    const buyer = await fixture<FixtureUser>("/user", { role: "STUDENT" });
    await page.request.post("/api/auth/sign-in/email", {
      headers: { origin: "http://127.0.0.1:3100" },
      data: { email: buyer.email, password: buyer.password },
    });

    await gotoStable(page, `/${locale}/courses/${COURSE}`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: copy(locale, "أضف إلى السلة", "Add to cart") }).click();
    await expect(
      page.getByRole("button", { name: copy(locale, "في السلة — أزل", "In cart — remove") }),
    ).toBeVisible();
    await gotoStable(page, `/${locale}/cart`, { waitUntil: "networkidle" });
    await page
      .getByRole("button", { name: copy(locale, "متابعة الدفع", "Continue to payment") })
      .click();
    await page.waitForURL(/127\.0\.0\.1:3200\/pay\//, { timeout: 30_000 });
    await page.getByRole("button", { name: "Pay with 3-D Secure" }).click();
    await expect(page.getByText("3-D Secure authentication")).toBeVisible();
    await page.getByRole("button", { name: "Authenticate payment" }).click();

    await page.waitForURL(new RegExp(`/${locale}/checkout/success\\?session_id=`), {
      timeout: 30_000,
    });
    await expect(
      page.getByRole("heading", {
        name: copy(
          locale,
          "تم الدفع، والدورات في حسابك",
          "Payment complete — the courses are yours",
        ),
      }),
    ).toBeVisible({ timeout: 20_000 });
    await gotoStable(page, `/${locale}/courses/${COURSE}`, { waitUntil: "networkidle" });
    await expect(
      page.getByRole("link", { name: copy(locale, "اذهب إلى الدورة", "Go to the course") }),
    ).toBeVisible();
  });
}
