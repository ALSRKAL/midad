import { readFileSync } from "node:fs";

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/** Engagement accessibility gate (P09): review form, notifications and announcements. */

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
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const blocking = results.violations
    .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
    .map((violation) => `${violation.id} (${violation.nodes.length}): ${violation.help}`);
  expect(blocking, blocking.join("\n")).toEqual([]);
}

test.describe("engagement axe", () => {
  for (const locale of ["ar", "en"] as const) {
    for (const theme of THEMES) {
      test(`${locale} course reviews (${theme})`, async ({ page }) => {
        await signIn(page, "student.demo@midad.test");
        await audit(page, `/${locale}/courses/modern-react-app-development`, theme);
      });
      test(`${locale} notifications (${theme})`, async ({ page }) => {
        await signIn(page, "student.demo@midad.test");
        await audit(page, `/${locale}/notifications`, theme);
      });
      test(`${locale} announcements (${theme})`, async ({ page }) => {
        await signIn(page, "instructor.demo@midad.test");
        await audit(page, `/${locale}/instructor/announcements`, theme);
      });
    }
  }
});
