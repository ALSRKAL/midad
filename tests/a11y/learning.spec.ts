import { readFileSync } from "node:fs";

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/** Accessibility gate for the learning dashboard and player (P07). */

const PASSWORD = readFileSync("/tmp/midad-e2e-password.txt", "utf8").trim();
const fixture = JSON.parse(readFileSync("/tmp/midad-e2e-learner.json", "utf8")) as {
  email: string;
  courseSlug: string;
  videoLessonId: string;
  previewLessonId: string;
};
const THEMES = ["light", "dark"] as const;

async function signIn(page: Page): Promise<void> {
  const response = await page.request.post("/api/auth/sign-in/email", {
    headers: { origin: "http://127.0.0.1:3100" },
    data: { email: fixture.email, password: PASSWORD },
  });
  expect(response.ok(), "learner sign-in").toBe(true);
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
    .map((violation) => `${violation.id} (${violation.nodes.length} nodes): ${violation.help}`);
  expect(blocking, blocking.join("\n")).toEqual([]);
}

test.describe("learning axe", () => {
  for (const locale of ["ar", "en"] as const) {
    for (const theme of THEMES) {
      test(`${locale}/dashboard (${theme})`, async ({ page }) => {
        await signIn(page);
        await audit(page, `/${locale}/dashboard`, theme);
      });
      test(`${locale} player (${theme})`, async ({ page }) => {
        await signIn(page);
        await audit(page, `/${locale}/learn/${fixture.courseSlug}/${fixture.videoLessonId}`, theme);
      });
      test(`${locale} notes panel (${theme})`, async ({ page }) => {
        await signIn(page);
        await page.addInitScript((value) => localStorage.setItem("midad-theme", value), theme);
        await page.goto(
          `/${locale}/learn/${fixture.courseSlug}/${fixture.videoLessonId}?tab=notes`,
          { waitUntil: "networkidle" },
        );
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
          .analyze();
        const blocking = results.violations
          .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
          .map((violation) => `${violation.id}: ${violation.help}`);
        expect(blocking, blocking.join("\n")).toEqual([]);
      });
      test(`${locale} questions panel (${theme})`, async ({ page }) => {
        await signIn(page);
        await page.addInitScript((value) => localStorage.setItem("midad-theme", value), theme);
        await page.goto(
          `/${locale}/learn/${fixture.courseSlug}/${fixture.videoLessonId}?tab=questions`,
          { waitUntil: "networkidle" },
        );
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
          .analyze();
        const blocking = results.violations
          .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
          .map((violation) => `${violation.id}: ${violation.help}`);
        expect(blocking, blocking.join("\n")).toEqual([]);
      });
      test(`${locale} preview player (${theme})`, async ({ page }) => {
        await audit(
          page,
          `/${locale}/learn/${fixture.courseSlug}/${fixture.previewLessonId}`,
          theme,
        );
      });
    }
  }
});
