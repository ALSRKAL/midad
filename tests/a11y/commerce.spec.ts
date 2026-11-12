import { readFileSync } from "node:fs";

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * Accessibility gate for the commerce surfaces (P06). Same bar as the rest of the app: zero serious
 * or critical violations in both locales and themes.
 */

const PASSWORD = readFileSync("/tmp/midad-e2e-password.txt", "utf8").trim();
const THEMES = ["light", "dark"] as const;

async function signIn(page: Page, email: string): Promise<void> {
  const response = await page.request.post("/api/auth/sign-in/email", {
    headers: { origin: "http://127.0.0.1:3100" },
    data: { email, password: PASSWORD },
  });
  expect(response.ok(), `sign-in for ${email}`).toBe(true);
}

async function audit(page: Page, path: string, theme: string): Promise<void> {
  await page.addInitScript((value) => localStorage.setItem("midad-theme", value), theme);
  const response = await page.goto(path, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page.locator("html")).toHaveClass(new RegExp(theme));

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const blocking = results.violations
    .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
    .map((violation) => `${violation.id} (${violation.nodes.length} nodes): ${violation.help}`);
  expect(blocking, blocking.join("\n")).toEqual([]);
}

const GUEST_PAGES = ["/cart"] as const;
const BUYER_PAGES = ["/purchases"] as const;

test.describe("commerce axe", () => {
  for (const locale of ["ar", "en"] as const) {
    for (const theme of THEMES) {
      for (const path of GUEST_PAGES) {
        test(`${locale}${path} (${theme})`, async ({ page }) => {
          await audit(page, `/${locale}${path}`, theme);
        });
      }
      for (const path of BUYER_PAGES) {
        test(`${locale}${path} (${theme})`, async ({ page }) => {
          await signIn(page, "student.demo@midad.test");
          await audit(page, `/${locale}${path}`, theme);
        });
      }
      test(`${locale}/instructor/coupons (${theme})`, async ({ page }) => {
        await signIn(page, "instructor.demo@midad.test");
        await audit(page, `/${locale}/instructor/coupons`, theme);
      });
      test(`${locale}/admin/coupons (${theme})`, async ({ page }) => {
        await signIn(page, "admin@midad.test");
        await audit(page, `/${locale}/admin/coupons`, theme);
      });
    }
  }
});
