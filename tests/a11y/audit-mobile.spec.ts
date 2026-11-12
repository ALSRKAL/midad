import { readFileSync } from "node:fs";

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { AUDIT_ROLES } from "../e2e/audit/routes";

/**
 * Mobile accessibility audit (P14-T02).
 *
 * The interaction audit's complete route list (all four roles, both locales) is scanned on Pixel 7
 * and iPhone 14, in both themes, with the same zero serious/critical gate as desktop. This project
 * runs on the two mobile Playwright projects only; the project matrix in playwright.config.ts is
 * the scope, not a runtime skip.
 */

const PASSWORD = readFileSync("/tmp/midad-e2e-password.txt", "utf8").trim();
const THEMES = ["light", "dark"] as const;

// One test scans every admin route on a loaded host; the default 180 s is not enough when each
// axe pass takes 10–60 s. This does not relax the zero-violation gate.
test.describe.configure({ timeout: 600_000 });

async function signIn(page: Page, email: string): Promise<void> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await page.request.post("/api/auth/sign-in/email", {
        headers: { origin: "http://127.0.0.1:3100" },
        data: { email, password: PASSWORD },
      });
      if (response.ok()) return;
      lastError = new Error(`sign-in for ${email} failed with ${response.status()}`);
    } catch (error) {
      lastError = error;
    }
    await page.waitForTimeout(300);
  }
  throw lastError instanceof Error ? lastError : new Error(`sign-in for ${email} failed`);
}

for (const [role, config] of Object.entries(AUDIT_ROLES)) {
  for (const locale of ["ar", "en"] as const) {
    for (const theme of THEMES) {
      test(`${role} ${locale} ${theme}`, async ({ page }) => {
        await page.context().clearCookies();
        if (config.email !== null) await signIn(page, config.email);
        await page.addInitScript((value) => localStorage.setItem("midad-theme", value), theme);

        for (const path of config.paths) {
          const response = await page.goto(`/${locale}${path}`, { waitUntil: "networkidle" });
          expect(response?.status(), `${role} ${path}`).toBe(200);

          const results = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
            .analyze();
          const blocking = results.violations
            .filter(
              (violation) => violation.impact === "serious" || violation.impact === "critical",
            )
            .map(
              (violation) =>
                `${path} ${violation.id} (${violation.nodes.length}): ${violation.help}`,
            );
          expect(blocking, `${role} ${locale} ${theme} ${path}\n${blocking.join("\n")}`).toEqual(
            [],
          );
        }
      });
    }
  }
}
