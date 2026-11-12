import { readFileSync } from "node:fs";

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/** Finance accessibility gate (P10): instructor analytics/earnings, purchases, admin finance pages. */

const PASSWORD = readFileSync("/tmp/midad-e2e-password.txt", "utf8").trim();
const refundBuyer = JSON.parse(readFileSync("/tmp/midad-e2e-refund-buyer.json", "utf8")) as {
  email: string;
};
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
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const blocking = results.violations
    .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
    .map((violation) => `${violation.id} (${violation.nodes.length}): ${violation.help}`);
  expect(blocking, blocking.join("\n")).toEqual([]);
}

test.describe("finance axe", () => {
  for (const locale of ["ar", "en"] as const) {
    for (const theme of THEMES) {
      test(`${locale} instructor analytics (${theme})`, async ({ page }) => {
        await signIn(page, "instructor.demo@midad.test");
        await audit(page, `/${locale}/instructor`, theme);
      });
      test(`${locale} instructor earnings (${theme})`, async ({ page }) => {
        await signIn(page, "instructor.demo@midad.test");
        await audit(page, `/${locale}/instructor/earnings`, theme);
      });
    }
  }

  for (const theme of THEMES) {
    test(`ar purchases refund form (${theme})`, async ({ page }) => {
      await signIn(page, refundBuyer.email);
      await audit(page, "/ar/purchases", theme);
    });
    test(`ar admin overview (${theme})`, async ({ page }) => {
      await signIn(page, "admin@midad.test");
      await audit(page, "/ar/admin", theme);
    });
  }

  test("ar admin finance tables", async ({ page }) => {
    await signIn(page, "admin@midad.test");
    for (const path of [
      "/ar/admin/orders",
      "/ar/admin/payouts",
      "/ar/admin/reports",
      "/ar/admin/messages",
    ]) {
      await audit(page, path, "light");
    }
  });

  test("ar admin settings", async ({ page }) => {
    await signIn(page, "admin@midad.test");
    await audit(page, "/ar/admin/settings", "light");
  });
});
