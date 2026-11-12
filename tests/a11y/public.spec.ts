import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Public-surface accessibility (P11-T04): catalog, course, category, instructor and the static
 * marketing pages, in both locales and both themes. Private areas have their own phase suites.
 */

const PAGES = [
  "/courses",
  "/courses/modern-react-app-development",
  "/categories/programming",
  "/instructors/noor-almutairi",
  "/about",
  "/faq",
  "/contact",
] as const;
const THEMES = ["light", "dark"] as const;

for (const locale of ["ar", "en"] as const) {
  for (const theme of THEMES) {
    for (const path of PAGES) {
      test(`${locale} ${path} (${theme})`, async ({ page }) => {
        await page.addInitScript((value) => localStorage.setItem("midad-theme", value), theme);
        const response = await page.goto(`/${locale}${path}`, { waitUntil: "networkidle" });
        expect(response?.status()).toBe(200);
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
          .analyze();
        const blocking = results.violations
          .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
          .map((violation) => `${violation.id} (${violation.nodes.length}): ${violation.help}`);
        expect(blocking, blocking.join("\n")).toEqual([]);
      });
    }
  }
}
