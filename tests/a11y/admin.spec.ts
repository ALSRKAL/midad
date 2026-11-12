import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * Accessibility gate for the admin area (P05, the product requirements).
 *
 * Zero `serious`/`critical` violations in both locales and both themes. Dynamic review pages are
 * reached through their queue rows, so the audit runs against whatever a reviewer would open and
 * does not depend on a hard-coded fixture id.
 *
 * Desktop only: the admin tables are wide data grids; the mobile layout is still captured in the
 * screenshot matrix and the functional suite exercises the same components.
 */

const PASSWORD = "Midad-Test-2026";
const ADMIN = "admin@midad.test";
const THEMES = ["light", "dark"] as const;

async function signIn(page: Page): Promise<void> {
  const response = await page.request.post("/api/auth/sign-in/email", {
    headers: { origin: "http://127.0.0.1:3100" },
    data: { email: ADMIN, password: PASSWORD },
  });
  expect(response.ok(), "admin sign-in").toBe(true);
}

async function audit(page: Page, path: string, theme: string): Promise<void> {
  await page.addInitScript((value) => localStorage.setItem("midad-theme", value), theme);
  const response = await page.goto(path, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page.locator("html")).toHaveClass(new RegExp(theme));
  // Let webfonts and the dark-theme variable recalculation settle; scanning mid-swap produced
  // transient contrast/target-size reports on a loaded host.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();

  const blocking = results.violations
    .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
    .map((violation) => `${violation.id} (${violation.nodes.length} nodes): ${violation.help}`);

  expect(blocking, blocking.join("\n")).toEqual([]);
}

/** The first pending row's URL, with the locale segment swapped. */
async function firstQueueDetail(page: Page, queue: string): Promise<string> {
  await page.goto(queue, { waitUntil: "networkidle" });
  const href = await page
    .locator('a[href*="/admin/"]')
    .filter({ hasText: /مراجعة|Review/ })
    .first()
    .getAttribute("href");
  if (href === null) throw new Error(`No review row in ${queue}`);
  return href;
}

const PAGES = [
  "/admin",
  "/admin/users",
  "/admin/courses",
  "/admin/applications",
  "/admin/categories",
  "/admin/audit",
] as const;

test.describe("admin axe", () => {
  for (const locale of ["ar", "en"] as const) {
    for (const theme of THEMES) {
      for (const pagePath of PAGES) {
        test(`${locale}${pagePath} (${theme})`, async ({ page }) => {
          await signIn(page);
          await audit(page, `/${locale}${pagePath}`, theme);
        });
      }

      test(`${locale} course review detail (${theme})`, async ({ page }) => {
        await signIn(page);
        // The fixture queue rows may be consumed by the admin spec; published seeded courses are
        // never mutated by the suite, so their detail page is deterministic.
        const href = await firstQueueDetail(page, `/${locale}/admin/courses?status=PUBLISHED`);
        await audit(page, href, theme);
      });

      test(`${locale} application detail (${theme})`, async ({ page }) => {
        await signIn(page);
        const href = await firstQueueDetail(page, `/${locale}/admin/applications`);
        await audit(page, href, theme);
      });
    }
  }
});
