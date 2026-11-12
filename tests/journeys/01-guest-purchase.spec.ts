import { expect, test } from "@playwright/test";

import { fixture, type FixtureUser } from "../e2e/helpers/fixtures";
import { copy, gotoStable, messageText, unique, waitForMail } from "./helpers";

/**
 * Journey 1 (§13.3): guest searches, opens a course, adds to cart, registers, verifies the email,
 * keeps the cart, applies a coupon, pays through the gateway and sees the course in the dashboard.
 * Runs in Arabic and English on every engine; the coupon is provisioned per project.
 */

const PAID_COURSE = "data-pipelines-and-orchestration";

for (const locale of ["ar", "en"] as const) {
  test(`guest purchase in ${locale}`, async ({ page }) => {
    const coupon = await fixture<FixtureUser & { couponCode: string }>("/buyer");
    const email = `${unique("journey1")}@midad.test`;
    const password = ["Midad", "E2E", "2026"].join("-");

    await page.context().clearCookies();
    await page.goto(`/${locale}/courses?q=${encodeURIComponent("بيانات")}`, {
      waitUntil: "networkidle",
    });
    await page.goto(`/${locale}/courses/${PAID_COURSE}`, { waitUntil: "networkidle" });

    await page.getByRole("button", { name: copy(locale, "أضف إلى السلة", "Add to cart") }).click();
    await expect(
      page.getByRole("button", { name: copy(locale, "في السلة — أزل", "In cart — remove") }),
    ).toBeVisible();
    await page.getByRole("link", { name: copy(locale, "اعرض السلة", "View cart") }).click();

    await page
      .getByRole("link", { name: copy(locale, "سجّل الدخول لإتمام الدفع", "Sign in to check out") })
      .click();
    await page
      .getByRole("link", {
        name: copy(locale, "ليس لديك حساب؟ أنشئ حسابًا", "No account yet? Create one"),
      })
      .click();
    await page
      .getByLabel(copy(locale, "الاسم", "Name"))
      .fill(copy(locale, "مشترٍ جديد", "New buyer"));
    await page.getByLabel(copy(locale, "البريد الإلكتروني", "Email address")).fill(email);
    await page.getByLabel(copy(locale, "كلمة المرور", "Password")).fill(password);
    await page
      .getByRole("button", { name: copy(locale, "إنشاء الحساب", "Create account") })
      .click();
    await expect(
      page.getByText(
        copy(
          locale,
          "أرسلنا رسالة إلى بريدك. افتح الرابط لتفعيل الحساب، ثم سجّل الدخول.",
          "We sent you an email. Open the link to verify your account, then sign in.",
        ),
      ),
    ).toBeVisible();

    const message = await waitForMail(email, locale === "ar" ? "فعّل" : "Verify");
    const body = await messageText(message.ID);
    const link = body.match(/https?:\/\/[^\s"<>]+verify-email[^\s"<>]*/)?.[0];
    expect(link, "verification link").toBeDefined();
    await page.goto(link ?? "", { waitUntil: "networkidle" });

    await page.getByLabel(copy(locale, "البريد الإلكتروني", "Email address")).fill(email);
    await page.getByLabel(copy(locale, "كلمة المرور", "Password")).fill(password);
    await page.getByRole("button", { name: copy(locale, "دخول", "Sign in") }).click();
    await page.waitForURL(new RegExp(`/${locale}$`), { timeout: 20_000 });

    // MergeGuestCart runs as a client effect after sign-in and deletes the guest cookie only after
    // the database insert commits. Waiting for the cookie to disappear proves the merge finished,
    // independent of whether the shell's badge refresh survived the redirect race.
    await expect
      .poll(
        async () => (await page.context().cookies()).some((cookie) => cookie.name === "midad_cart"),
        { timeout: 40_000 },
      )
      .toBe(false);

    await gotoStable(page, `/${locale}/cart`);
    await expect(
      page.getByRole("link", {
        name: new RegExp(
          copy(locale, "خطوط البيانات والتنسيق بين مهامّها", "Data Pipelines and Orchestration"),
        ),
      }),
    ).toBeVisible();

    await page.locator("#coupon-code").fill(coupon.couponCode.toLowerCase());
    await page.getByRole("button", { name: copy(locale, "طبّق", "Apply") }).click();
    await expect(page.getByText(coupon.couponCode, { exact: false })).toBeVisible();

    await page
      .getByRole("button", { name: copy(locale, "متابعة الدفع", "Continue to payment") })
      .click();
    await page.waitForURL(/127\.0\.0\.1:3200\/pay\//, { timeout: 30_000 });
    await page.getByRole("button", { name: /^Pay \d/ }).click();
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

    // The browser can still be completing the checkout redirect; gotoStable retries both the
    // WebKit and Firefox spellings of an aborted document request.
    await gotoStable(page, `/${locale}/dashboard`);
    await expect(
      page
        .getByText(
          copy(locale, "خطوط البيانات والتنسيق بين مهامّها", "Data Pipelines and Orchestration"),
        )
        .first(),
    ).toBeVisible();
  });
}
