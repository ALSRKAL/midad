import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Accessibility gate for the application shell (the product requirements).
 *
 * Threshold is zero `serious` or `critical` violations, in both locales and both themes. The theme
 * is set through localStorage before navigation so the audit sees exactly what a returning visitor
 * sees, without waiting for a client-side toggle.
 */
const PAGES = ["/ar", "/en"] as const;
const THEMES = ["light", "dark"] as const;

for (const path of PAGES) {
  for (const theme of THEMES) {
    test(`axe: ${path} (${theme}) has no serious or critical violations`, async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem("midad-theme", value), theme);
      await page.goto(path);
      await expect(page.locator("html")).toHaveClass(new RegExp(theme));

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();

      const blocking = results.violations
        .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
        .map((violation) => `${violation.id} (${violation.nodes.length} nodes): ${violation.help}`);

      expect(blocking, blocking.join("\n")).toEqual([]);
    });
  }
}

test("the design-system catalogue is not reachable in a production build", async ({ page }) => {
  const response = await page.goto("/ar/design-system");
  expect(response?.status()).toBe(404);
});
