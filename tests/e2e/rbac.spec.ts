import { expect, test, type Page } from "@playwright/test";

/**
 * Route protection (P02-T04, the product requirements journey 10).
 *
 * Every protected route is checked for every role, and a signed-in visitor with the wrong role must
 * see the denial screen *instead of* the protected markup — not merely a redirect that a direct URL
 * can bypass.
 */

async function signInAs(page: Page, email: string): Promise<void> {
  await page.goto("/ar/login");
  await page.getByLabel("البريد الإلكتروني").fill(email);
  await page.getByLabel("كلمة المرور").fill("Midad-Test-2026");
  await page.getByRole("button", { name: "دخول" }).click();
  // `\/ar/` would also match /ar/login, so anchor the end and then wait for a signed-in signal
  // before the test navigates to a protected route.
  await page.waitForURL(/\/ar$/);
  await page.waitForLoadState("networkidle");
  // A signed-in visitor has no sign-in link anywhere in the DOM (the mobile drawer renders it only
  // when signed out), which works as a signal on both viewports without requiring visibility.
  await expect(page.getByRole("link", { name: "تسجيل الدخول" })).toHaveCount(0);
}

test.describe.configure({ mode: "serial" });

test.describe("protected routes", () => {
  test("anonymous visitors are sent to the login form and brought back", async ({ page }) => {
    await page.goto("/ar/admin");
    await expect(page).toHaveURL(/\/ar\/login\?next=/);
    await expect(page.getByRole("heading", { level: 1, name: "تسجيل الدخول" })).toBeVisible();

    await page.goto("/ar/instructor");
    await expect(page).toHaveURL(/\/ar\/login\?next=/);
  });

  test("a student is denied the admin and instructor areas", async ({ page }) => {
    await signInAs(page, "student.demo@midad.test");

    await page.goto("/ar/admin");
    await expect(page.getByRole("heading", { name: "لا تملك صلاحية الوصول" })).toBeVisible();
    await expect(page.getByText("لوحة الإدارة")).toHaveCount(0);

    await page.goto("/ar/instructor");
    await expect(page.getByRole("heading", { name: "لا تملك صلاحية الوصول" })).toBeVisible();
    await expect(page.getByText("لوحة المدرب")).toHaveCount(0);
  });

  test("an instructor reaches the instructor area but not the admin area", async ({ page }) => {
    await signInAs(page, "instructor.demo@midad.test");

    await page.goto("/ar/instructor");
    await expect(page.getByRole("heading", { level: 1, name: "لوحة المدرب" })).toBeVisible();

    await page.goto("/ar/admin");
    await expect(page.getByRole("heading", { name: "لا تملك صلاحية الوصول" })).toBeVisible();
  });

  test("an admin reaches both areas", async ({ page }) => {
    await signInAs(page, "admin@midad.test");

    await page.goto("/ar/admin");
    await expect(page.getByRole("heading", { level: 1, name: "لوحة الإدارة" })).toBeVisible();

    await page.goto("/ar/instructor");
    await expect(page.getByRole("heading", { level: 1, name: "لوحة المدرب" })).toBeVisible();
  });

  test("a banned account cannot sign in at all (BR-21)", async ({ page }) => {
    await page.goto("/ar/login");
    await page.getByLabel("البريد الإلكتروني").fill("student.banned@midad.test");
    await page.getByLabel("كلمة المرور").fill("Midad-Test-2026");
    await page.getByRole("button", { name: "دخول" }).click();

    await expect(page.locator('p[role="alert"]')).toBeVisible();
    await expect(page.getByRole("button", { name: "خروج" })).toHaveCount(0);
  });
});
