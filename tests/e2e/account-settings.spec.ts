import { readFile } from "node:fs/promises";

import { expect, test, type Page } from "@playwright/test";

/**
 * Account settings journey (P02-T05, the product requirements).
 *
 * Uses one disposable account per project so the destructive tests (password change, revoking the
 * current session, deleting the account) never touch the seeded fixtures the rest of the suite
 * depends on. The account is created through the real registration form and verified through the
 * real email in Mailpit, exactly like a learner would.
 */

const MAILPIT = process.env.MAILPIT_URL ?? "http://127.0.0.1:8025";
const INITIAL_PASSWORD = "Midad-Account-Init1";
const CHANGED_PASSWORD = "Midad-Account-New2";

// One PNG pixel: a real image the browser can decode and the canvas can crop.
const ONE_PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=",
  "base64",
);

let accountEmail = "";
let accountPassword = INITIAL_PASSWORD;

type MailpitMessage = { ID: string; To: Array<{ Address: string }>; Subject: string };

async function messageText(id: string): Promise<string> {
  const response = await fetch(`${MAILPIT}/api/v1/message/${id}`);
  const body = (await response.json()) as { Text?: string; HTML?: string };
  return body.Text ?? body.HTML ?? "";
}

async function waitForVerification(address: string): Promise<string> {
  const deadline = Date.now() + 15_000;
  const query = new URLSearchParams({ query: `to:${address} subject:"فعّل"` });
  while (Date.now() < deadline) {
    const response = await fetch(`${MAILPIT}/api/v1/search?${query.toString()}`);
    const body = (await response.json()) as { messages: MailpitMessage[] };
    const message = body.messages.find(
      (item) =>
        item.Subject.includes("فعّل") &&
        item.To.some((to) => to.Address.toLowerCase() === address.toLowerCase()),
    );
    if (message !== undefined) {
      const text = await messageText(message.ID);
      const link = text.match(/https?:\/\/[^\s"<>]+verify-email[^\s"<>]*/)?.[0];
      if (link !== undefined) return link;
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error(`No verification email for ${address} within 15s`);
}

async function signIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/ar/login");
  await page.getByLabel("البريد الإلكتروني").fill(email);
  await page.getByLabel("كلمة المرور").fill(password);
  await page.getByRole("button", { name: "دخول" }).click();
  await page.waitForURL(/\/ar$/);
  // The sign-in redirect can still be settling; wait before opening settings (P15-T01).
  await page.waitForLoadState("networkidle");
}

async function openSettings(page: Page): Promise<void> {
  await page.goto("/ar/settings");
  await expect(page.getByRole("heading", { level: 1, name: "إعدادات الحساب" })).toBeVisible();
}

test.describe.configure({ mode: "serial" });

test.describe("account settings", () => {
  test("registers a disposable account and verifies it", async ({ page }, testInfo) => {
    const suffix = `${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    accountEmail = `account-${suffix}@midad.test`;

    await page.goto("/ar/register");
    await page.getByLabel("الاسم").fill("حساب الإعدادات");
    await page.getByLabel("البريد الإلكتروني").fill(accountEmail);
    await page.getByLabel("كلمة المرور").fill(INITIAL_PASSWORD);
    await page.getByRole("button", { name: "إنشاء الحساب" }).click();
    await expect(page.getByText("أرسلنا رسالة إلى بريدك")).toBeVisible();

    const link = await waitForVerification(accountEmail);
    await page.goto(link);

    await signIn(page, accountEmail, INITIAL_PASSWORD);
    await expect(page.getByRole("link", { name: "تسجيل الدخول" })).toHaveCount(0);
  });

  test("anonymous visitors are redirected to sign in", async ({ page }) => {
    await page.goto("/ar/settings");
    await expect(page).toHaveURL(/\/ar\/login\?next=/);
  });

  test("updates the profile, theme and notification preferences", async ({ page }) => {
    await signIn(page, accountEmail, accountPassword);
    await openSettings(page);

    await page.locator("#profile-name").fill("سالم الاختبار");
    await page.locator("#profile-bio").fill("مهتم بتعلّم التجارة الرقمية وتصميم المنتجات.");
    await page.locator("#profile-theme").selectOption("dark");
    await page.getByRole("button", { name: "حفظ التغييرات" }).click();
    await expect(page.getByText("حُفظت التغييرات.").first()).toBeVisible();
    await expect(page.locator("html")).toHaveClass(/dark/);

    await page.reload();
    await expect(page.locator("#profile-name")).toHaveValue("سالم الاختبار");
    await expect(page.locator("#profile-bio")).toHaveValue(
      "مهتم بتعلّم التجارة الرقمية وتصميم المنتجات.",
    );

    const productUpdates = page.getByRole("switch", { name: "أخبار المنصة وعروضها" });
    await expect(productUpdates).not.toBeChecked();
    await productUpdates.click();
    await page.getByRole("button", { name: "حفظ التفضيلات" }).click();
    await expect(page.getByText("حُفظت التغييرات.").first()).toBeVisible();

    await page.reload();
    await expect(page.getByRole("switch", { name: "أخبار المنصة وعروضها" })).toBeChecked();
    await expect(page.getByRole("switch", { name: "ردود على أسئلتي وملاحظاتي" })).toBeChecked();
  });

  test("uploads and crops an avatar, and it survives a reload", async ({ page }) => {
    await signIn(page, accountEmail, accountPassword);
    await openSettings(page);

    await page.locator("input#avatar").setInputFiles({
      name: "avatar.png",
      mimeType: "image/png",
      buffer: ONE_PIXEL_PNG,
    });

    await expect(page.getByRole("heading", { name: "قص الصورة" })).toBeVisible();
    await page.getByRole("button", { name: "استخدم هذه الصورة" }).click();

    const avatar = page.locator('img[src*="/midad-public/avatars/"]');
    await expect(avatar).toBeVisible();

    await page.reload();
    await expect(page.locator('img[src*="/midad-public/avatars/"]')).toBeVisible();
  });

  test("changes the password and signs in with the new one", async ({ page }) => {
    await signIn(page, accountEmail, accountPassword);
    await openSettings(page);

    await page.locator("#current-password").fill(accountPassword);
    await page.locator("#new-password").fill(CHANGED_PASSWORD);
    await page.locator("#confirm-password").fill(CHANGED_PASSWORD);
    await page.getByRole("button", { name: "تغيير كلمة المرور" }).click();
    await expect(page.getByText("تم تغيير كلمة المرور، وأُنهيت الجلسات الأخرى.")).toBeVisible();

    // Sign out of all devices, then prove the new password works and the old one does not.
    await page.getByRole("button", { name: "تسجيل الخروج من كل الأجهزة" }).click();
    await expect(page).toHaveURL(/\/ar\/login/);

    await page.getByLabel("البريد الإلكتروني").fill(accountEmail);
    await page.getByLabel("كلمة المرور").fill(accountPassword);
    await page.getByRole("button", { name: "دخول" }).click();
    await expect(page.locator('p[role="alert"]')).toBeVisible();

    accountPassword = CHANGED_PASSWORD;
    await signIn(page, accountEmail, accountPassword);
    await expect(page.getByRole("link", { name: "تسجيل الدخول" })).toHaveCount(0);
  });

  test("lists the active session and can end it", async ({ page }) => {
    await signIn(page, accountEmail, accountPassword);
    await openSettings(page);

    await expect(page.getByText("هذا الجهاز")).toHaveCount(1);
    const sessionsRegion = page.getByRole("region", { name: "الجلسات النشطة" });
    const sessionRows = sessionsRegion.getByRole("listitem");
    await expect(sessionRows.first()).toBeVisible();

    // Earlier sign-ins in this serial file may have left a session row behind. "End other sessions"
    // is exactly the control that cleans them up, so use it when needed and prove the result.
    if ((await sessionRows.count()) > 1) {
      await page.getByRole("button", { name: "إنهاء الجلسات الأخرى" }).click();
      await expect(page.getByText("أُنهيت الجلسات الأخرى.")).toBeVisible();
    }
    await expect(sessionRows).toHaveCount(1);

    await sessionRows.getByRole("button", { name: /^إنهاء/ }).click();
    await expect(page).toHaveURL(/\/ar\/login/);
    await expect(page.getByRole("heading", { level: 1, name: "تسجيل الدخول" })).toBeVisible();
  });

  test("exports the account data as JSON", async ({ page }) => {
    await signIn(page, accountEmail, accountPassword);
    await openSettings(page);

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "تصدير بياناتي" }).click();
    const download = await downloadPromise;
    const path = await download.path();
    expect(path).not.toBeNull();

    const content = await readFile(path ?? "", "utf8");
    const data = JSON.parse(content) as {
      schemaVersion: number;
      profile: { email: string; name: string; preferences: { notifyProductUpdates: boolean } };
      enrollments: unknown[];
    };

    expect(data.schemaVersion).toBe(1);
    expect(data.profile.email).toBe(accountEmail);
    expect(data.profile.name).toBe("سالم الاختبار");
    expect(data.profile.preferences.notifyProductUpdates).toBe(true);
    expect(Array.isArray(data.enrollments)).toBe(true);
  });

  test("soft-deletes the account and refuses further sign-in", async ({ page }) => {
    await signIn(page, accountEmail, accountPassword);
    await openSettings(page);

    await page.getByRole("button", { name: "حذف حسابي" }).click();
    await page.getByLabel("اكتب بريدك الإلكتروني").fill(accountEmail);
    await page.getByRole("button", { name: "حذف الحساب نهائيًا" }).click();

    await page.waitForURL(/\/ar$/);
    // The deleted session is gone, so the guarded page must redirect even though the browser still
    // holds the old cookie. This works on desktop and mobile, where the sign-in link lives in a
    // drawer that is not mounted while closed.
    await page.goto("/ar/settings");
    await expect(page).toHaveURL(/\/ar\/login\?next=/);

    await page.goto("/ar/login");
    await page.getByLabel("البريد الإلكتروني").fill(accountEmail);
    await page.getByLabel("كلمة المرور").fill(accountPassword);
    await page.getByRole("button", { name: "دخول" }).click();
    await expect(page.locator('p[role="alert"]')).toContainText("محذوف");
    await expect(page).toHaveURL(/\/ar\/login/);
  });
});
