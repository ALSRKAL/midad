import { readFileSync } from "node:fs";

import { expect, test, type Page } from "@playwright/test";

/**
 * Coupon management (P06-T02, BR-07): an instructor creates and deactivates a coupon for an owned
 * course, and an admin creates a platform-wide coupon. Codes include a timestamp, so every project
 * can run the same flow without colliding (P14-T01).
 */

const PASSWORD = readFileSync("/tmp/midad-e2e-password.txt", "utf8").trim();

test.describe.configure({ mode: "serial" });

async function signIn(page: Page, email: string): Promise<void> {
  const response = await page.request.post("/api/auth/sign-in/email", {
    headers: { origin: "http://127.0.0.1:3100" },
    data: { email, password: PASSWORD },
  });
  expect(response.ok(), `sign-in for ${email}`).toBe(true);
}

/** Coupon forms are server actions; wait for the root hydration marker before typing. */
async function gotoHydrated(page: Page, url: string): Promise<void> {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForSelector("html[data-hydrated=true]", { timeout: 60_000 });
}

test("an instructor creates and deactivates a coupon for an owned course", async ({ page }) => {
  await signIn(page, "instructor.demo@midad.test");
  const code = `INST${Date.now().toString(36).toUpperCase()}`;

  await gotoHydrated(page, "/ar/instructor/coupons");
  await expect(page.getByRole("heading", { name: "كوبونات الخصم", level: 2 })).toBeVisible();

  await page.locator("#coupon-new-code").fill(code);
  await page.locator("#coupon-new-percentage").fill("15");
  await page.locator("#coupon-new-starts").fill("2026-01-01T00:00");
  await page.locator("#coupon-new-ends").fill("2030-12-31T23:59");
  await page.locator("#coupon-new-max").fill("25");
  await page.locator("#coupon-new-per-user").fill("1");
  await page.getByRole("button", { name: "أنشئ الكوبون" }).click();

  await expect(page.getByText("أُنشئ الكوبون وأصبح ظاهرًا في القائمة.")).toBeVisible();
  const row = page.locator("tbody tr").filter({ hasText: code });
  await expect(row).toBeVisible({ timeout: 30_000 });
  await expect(row).toContainText("15%");

  await row.getByRole("button", { name: "أوقف" }).click();
  await expect(row).toContainText("متوقف");
});

test("an admin creates a platform-wide coupon", async ({ page }) => {
  await signIn(page, "admin@midad.test");
  const code = `PLAT${Date.now().toString(36).toUpperCase()}`;

  await gotoHydrated(page, "/ar/admin/coupons");
  await page.locator("#coupon-new-code").fill(code);
  await page.getByLabel("النوع").selectOption("FIXED");
  await page.locator("#coupon-new-amount").fill("25.00");
  await page.locator("#coupon-new-course").selectOption("");
  await page.locator("#coupon-new-starts").fill("2026-01-01T00:00");
  await page.locator("#coupon-new-ends").fill("2030-12-31T23:59");
  await page.locator("#coupon-new-max").fill("50");
  await page.locator("#coupon-new-per-user").fill("1");
  await page.getByRole("button", { name: "أنشئ الكوبون" }).click();

  const row = page.locator("tbody tr").filter({ hasText: code });
  await expect(row).toBeVisible({ timeout: 30_000 });
  await expect(row).toContainText("25 ر.س");
  await expect(row).toContainText("كل الدورات");
});
