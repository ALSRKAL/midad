import { expect, test, type Page } from "@playwright/test";

/**
 * Authentication rate limiting (P02-T07, the product requirements).
 *
 * Runs against its own server on port 3101 with a ceiling of 3 requests per 60-second window (the
 * production default is 5). The functional suite keeps the high ceiling on 3100, so exhausting a
 * bucket here can never break a sign-in test there.
 *
 * Each endpoint has its own bucket keyed by IP + path, so the tests are independent of each other.
 */

const BASE = "http://127.0.0.1:3101";
const ORIGIN = { origin: BASE };
const WRONG_PASSWORD = "another-wrong-password";

async function fillSignIn(page: Page, email: string): Promise<void> {
  await page.getByLabel("البريد الإلكتروني").fill(email);
  await page.getByLabel("كلمة المرور").fill(WRONG_PASSWORD);
  await page.getByRole("button", { name: "دخول" }).click();
}

test.describe.configure({ mode: "serial" });

test.describe("auth rate limiting", () => {
  test("sign-in allows three attempts and refuses the fourth", async ({ page }) => {
    await page.goto("/ar/login");

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await fillSignIn(page, "rate-limit@midad.test");
      await expect(page.locator('p[role="alert"]')).toContainText("البريد أو كلمة المرور");
    }

    await fillSignIn(page, "rate-limit@midad.test");
    await expect(page.locator('p[role="alert"]')).toContainText("محاولات كثيرة");

    // The API itself must return 429 with a Retry-After, not only the UI message.
    const response = await page.request.post("/api/auth/sign-in/email", {
      headers: ORIGIN,
      data: { email: "rate-limit@midad.test", password: WRONG_PASSWORD },
    });
    expect(response.status()).toBe(429);
    expect(response.headers()["retry-after"]).toBeTruthy();
  });

  test("sign-up is limited before it can create a flood of accounts", async ({ page }) => {
    // Better Auth deliberately answers an existing address like a new one, so each allowed attempt
    // uses a fresh address and really creates an unverified account; only the fourth is refused.
    const stamp = Date.now();
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await page.goto("/ar/register");
      await page.getByLabel("الاسم").fill("محاولة تكرار");
      await page.getByLabel("البريد الإلكتروني").fill(`rate-signup-${stamp}-${attempt}@midad.test`);
      await page.getByLabel("كلمة المرور").fill("another-wrong-password");
      await page.getByRole("button", { name: "إنشاء الحساب" }).click();
      await expect(page.getByText("أرسلنا رسالة إلى بريدك")).toBeVisible();
    }

    await page.goto("/ar/register");
    await page.getByLabel("الاسم").fill("محاولة تكرار");
    await page.getByLabel("البريد الإلكتروني").fill(`rate-signup-${stamp}-fourth@midad.test`);
    await page.getByLabel("كلمة المرور").fill("another-wrong-password");
    await page.getByRole("button", { name: "إنشاء الحساب" }).click();
    await expect(page.locator('p[role="alert"]')).toContainText("محاولات كثيرة");
  });

  test("password-reset requests are limited and do not claim an email was sent", async ({
    page,
  }) => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await page.goto("/ar/forgot-password");
      await page.getByLabel("البريد الإلكتروني").fill("nobody@midad.test");
      await page.getByRole("button", { name: "أرسل الرابط" }).click();
      await expect(page.getByText("تحقّق من بريدك")).toBeVisible();
    }

    await page.goto("/ar/forgot-password");
    await page.getByLabel("البريد الإلكتروني").fill("nobody@midad.test");
    await page.getByRole("button", { name: "أرسل الرابط" }).click();

    // A refused request must not show the "check your inbox" screen the learner would wait on.
    await expect(page.locator('p[role="alert"]')).toContainText("محاولات كثيرة");
    await expect(page.getByText("تحقّق من بريدك")).toHaveCount(0);
  });

  test("reset, verification and change-password are protected by the same rule", async ({
    page,
  }) => {
    const endpoints = [
      { path: "/api/auth/reset-password", data: { newPassword: "Midad-Unused-1", token: "bogus" } },
      { path: "/api/auth/send-verification-email", data: { email: "nobody@midad.test" } },
      {
        path: "/api/auth/change-password",
        data: { currentPassword: WRONG_PASSWORD, newPassword: "Midad-Unused-2" },
      },
    ];

    for (const endpoint of endpoints) {
      let lastStatus = 0;
      for (let attempt = 0; attempt < 4; attempt += 1) {
        const response = await page.request.post(endpoint.path, {
          headers: ORIGIN,
          data: endpoint.data,
        });
        lastStatus = response.status();
      }
      expect(lastStatus, `${endpoint.path} should be rate limited`).toBe(429);
    }
  });
});
