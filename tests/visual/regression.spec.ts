import { expect, test } from "@playwright/test";

/**
 * P12-T04 visual regression for stable public pages, both locales and both themes. Dynamic review
 * content on the course page is masked; catalog and static pages come from the fixed seed.
 */

const PAGES = [
  "/about",
  "/faq",
  "/terms",
  "/privacy",
  "/courses?q=zzzz-no-results",
  "/courses/modern-react-app-development",
  "/login",
  "/this-page-does-not-exist",
] as const;
const THEMES = ["light", "dark"] as const;

test.beforeAll(async ({ request }) => {
  // This project runs after mutation suites; remove their reviews so the seed page height and
  // rating are deterministic (the review block is masked, but its height is not).
  const response = await request.post("http://127.0.0.1:3201/visual-reset");
  expect(response.ok(), "visual fixture reset").toBe(true);
});

for (const locale of ["ar", "en"] as const) {
  for (const theme of THEMES) {
    for (const path of PAGES) {
      test(`${locale} ${path} ${theme}`, async ({ page }) => {
        await page.addInitScript((value) => localStorage.setItem("midad-theme", value), theme);
        const response = await page.goto(`/${locale}${path}`, { waitUntil: "networkidle" });
        expect(response?.status()).toBe(path.includes("this-page") ? 404 : 200);
        const mask =
          path === "/courses/modern-react-app-development"
            ? [
                page.locator("[aria-labelledby='reviews-title']"),
                // The "last updated" date follows the row's updatedAt, which fixture resets touch.
                page.locator("header p").last(),
              ]
            : [];
        await expect(page).toHaveScreenshot(
          `${locale}-${path.replace(/[^a-z0-9]+/gi, "-")}-${theme}.png`,
          {
            fullPage: true,
            animations: "disabled",
            caret: "hide",
            mask,
          },
        );
      });
    }
  }
}
