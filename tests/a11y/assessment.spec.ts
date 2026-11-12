import { readFileSync } from "node:fs";

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/** Assessment accessibility gate (P08): quiz intro, attempt form and public verification. */

const PASSWORD = readFileSync("/tmp/midad-e2e-password.txt", "utf8").trim();
const fixture = JSON.parse(readFileSync("/tmp/midad-e2e-learner.json", "utf8")) as {
  email: string;
  sampleCertificateCode: string | null;
  assessment: {
    courseSlug: string;
    quizLessonId: string;
    attemptId: string | null;
  };
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
    .map((violation) => `${violation.id} (${violation.nodes.length}): ${violation.help}`);
  expect(blocking, blocking.join("\n")).toEqual([]);
}

test.describe("assessment axe", () => {
  for (const locale of ["ar", "en"] as const) {
    for (const theme of THEMES) {
      test(`${locale} quiz intro (${theme})`, async ({ page }) => {
        await signIn(page);
        await audit(
          page,
          `/${locale}/learn/${fixture.assessment.courseSlug}/${fixture.assessment.quizLessonId}`,
          theme,
        );
      });

      test(`${locale} quiz attempt (${theme})`, async ({ page }) => {
        await signIn(page);
        const attempt = fixture.assessment.attemptId;
        if (attempt === null) return;
        await audit(
          page,
          `/${locale}/learn/${fixture.assessment.courseSlug}/${fixture.assessment.quizLessonId}/quiz?attempt=${attempt}`,
          theme,
        );
      });

      if (fixture.sampleCertificateCode !== null) {
        test(`${locale} certificate verification (${theme})`, async ({ page }) => {
          await audit(page, `/${locale}/verify/${fixture.sampleCertificateCode}`, theme);
        });
      }
    }
  }
});
