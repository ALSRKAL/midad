import { expect, test, type Page } from "@playwright/test";

import { fixture, type FixtureUser } from "../e2e/helpers/fixtures";
import { copy } from "./helpers";

/**
 * Journey 11 (§13.3): switching locale from every major page keeps the same place and state, the
 * theme survives a reload, and signing in from a new device applies the account's saved locale.
 */

const PATHS = ["/", "/courses", "/courses/modern-react-app-development", "/dashboard", "/settings"];

async function openLanguageLink(page: Page, target: "ar" | "en") {
  const name = target === "ar" ? /العربية/ : /English/;
  const direct = page.getByRole("link", { name });
  if ((await direct.count()) > 0 && (await direct.first().isVisible())) return direct.first();
  const menu = page.getByRole("button", { name: /افتح القائمة|Open menu/ });
  if ((await menu.count()) > 0) {
    await menu.first().click();
    const dialog = page.getByRole("dialog");
    return dialog.getByRole("link", { name });
  }
  return direct.first();
}

for (const locale of ["ar", "en"] as const) {
  test(`locale and theme persistence in ${locale}`, async ({ page, browser }) => {
    const user = await fixture<FixtureUser>("/user", { role: "STUDENT", locale: "AR" });
    await page.request.post("/api/auth/sign-in/email", {
      headers: { origin: "http://127.0.0.1:3100" },
      data: { email: user.email, password: user.password },
    });

    for (const path of PATHS) {
      await page.goto(`/${locale}${path}`, { waitUntil: "networkidle" });
      const target = locale === "ar" ? "en" : "ar";
      const link = await openLanguageLink(page, target);
      await link.click();
      const localizedPath = path === "/" ? `/${target}` : `/${target}${path}`;
      await expect(page).toHaveURL(new RegExp(`${localizedPath}(\\?|$)`), { timeout: 20_000 });
      expect(await page.evaluate(() => document.documentElement.dir)).toBe(
        target === "ar" ? "rtl" : "ltr",
      );
      const back = await openLanguageLink(page, locale);
      await back.click();
      const originalPath = path === "/" ? `/${locale}` : `/${locale}${path}`;
      await expect(page).toHaveURL(new RegExp(`${originalPath}(\\?|$)`), { timeout: 20_000 });
    }

    await page.goto(`/${locale}/courses`, { waitUntil: "networkidle" });
    await page.evaluate(() => localStorage.setItem("midad-theme", "dark"));
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.evaluate(() => localStorage.setItem("midad-theme", "light"));
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveClass(/light/);

    // New device: the login page starts in English, but the account preference is Arabic.
    const other = await browser.newContext();
    const otherPage = await other.newPage();
    await otherPage.goto("/en/login", { waitUntil: "networkidle" });
    await otherPage.getByLabel("Email address").fill(user.email);
    await otherPage.getByLabel("Password").fill(user.password);
    await otherPage.getByRole("button", { name: "Sign in" }).click();
    await expect(otherPage).toHaveURL(/\/ar$/, { timeout: 20_000 });
    expect(await otherPage.evaluate(() => document.documentElement.dir)).toBe("rtl");
    await other.close();

    // The account menu still shows the signed-in user (state survived the locale switches).
    await page.goto(`/${locale}/dashboard`, { waitUntil: "networkidle" });
    await expect(
      page.getByRole("heading", { name: copy(locale, "لوحة التعلّم", "Learning dashboard") }),
    ).toBeVisible();
  });
}
