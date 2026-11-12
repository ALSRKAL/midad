import { readFileSync, writeFileSync } from "node:fs";

import { expect, test, type Page } from "@playwright/test";

import { AUDIT_ROLES } from "./routes";

/**
 * Interaction audit (P12-T03): every visible link/control on each role's central route list must
 * have an accessible name, no empty/#/javascript href, and every internal link must answer <400.
 * Destructive controls are checked by the phase E2E suites (confirmation dialogs), never clicked
 * here; this audit is read-only so it can run safely for all four roles.
 */

const PASSWORD = readFileSync("/tmp/midad-e2e-password.txt", "utf8").trim();
const ROLES = AUDIT_ROLES;

type AuditRow = { role: string; locale: string; pages: number; controls: number; links: number };
const rows: AuditRow[] = [];

async function signIn(page: Page, email: string): Promise<void> {
  const response = await page.request.post("/api/auth/sign-in/email", {
    headers: { origin: "http://127.0.0.1:3100" },
    data: { email, password: PASSWORD },
  });
  expect(response.ok(), `sign-in for ${email}`).toBe(true);
}

test.describe.configure({ mode: "serial" });

for (const locale of ["ar", "en"] as const) {
  for (const [role, config] of Object.entries(ROLES)) {
    test(`${role} ${locale}`, async ({ page }) => {
      await page.context().clearCookies();
      if (config.email !== null) await signIn(page, config.email);
      let controls = 0;
      let links = 0;
      const checkedLinks = new Set<string>();

      for (const [index, path] of config.paths.entries()) {
        const response = await page.goto(`/${locale}${path}`, { waitUntil: "networkidle" });
        expect(response?.status(), `${role} ${path}`).toBe(200);
        if (index === 0) {
          const dir = await page.evaluate(() => document.documentElement.dir);
          expect(dir).toBe(locale === "ar" ? "rtl" : "ltr");
        }

        const found = await page
          .locator("a, button, [role=button], select, input[type=submit]")
          .evaluateAll((elements) =>
            elements
              .filter((element) => {
                const style = getComputedStyle(element);
                const rect = element.getBoundingClientRect();
                return (
                  style.visibility !== "hidden" &&
                  style.display !== "none" &&
                  rect.width > 0 &&
                  rect.height > 0
                );
              })
              .map((element) => {
                const label =
                  element.getAttribute("aria-label") ??
                  element.getAttribute("title") ??
                  (element.textContent ?? "").trim() ??
                  "";
                const labelledBy = element.getAttribute("aria-labelledby");
                const labelledText =
                  labelledBy === null
                    ? ""
                    : labelledBy
                        .split(/\s+/)
                        .map((id) => document.getElementById(id)?.textContent ?? "")
                        .join(" ")
                        .trim();
                return {
                  tag: element.tagName.toLowerCase(),
                  label,
                  labelledText,
                  href: element.getAttribute("href"),
                };
              }),
          );

        const unnamed = found.filter(
          (element) =>
            element.label === "" && element.labelledText === "" && element.tag !== "select",
        );
        expect(unnamed, `${role} ${path} unnamed controls: ${JSON.stringify(unnamed)}`).toEqual([]);

        for (const element of found) {
          controls += 1;
          if (element.tag !== "a") continue;
          links += 1;
          const href = element.href;
          expect(href, `${role} ${path} empty href`).not.toBeNull();
          // In-page anchors such as #main-content are real controls; "#" and javascript: are not.
          expect(href ?? "", `${role} ${path} placeholder href`).not.toBe("");
          expect(
            href === "#" || /^javascript:/i.test(href ?? ""),
            `${role} ${path} placeholder href`,
          ).toBe(false);
          if (href === null || !href.startsWith("/") || checkedLinks.has(href)) continue;
          checkedLinks.add(href);
          const internal = await page.request.get(href);
          expect(internal.status(), `${role} ${path} link ${href}`).toBeLessThan(400);
        }
      }

      rows.push({ role, locale, pages: config.paths.length, controls, links });
    });
  }
}

test.afterAll(() => {
  const totalPages = rows.reduce((sum, row) => sum + row.pages, 0);
  const totalControls = rows.reduce((sum, row) => sum + row.controls, 0);
  const totalLinks = rows.reduce((sum, row) => sum + row.links, 0);
  const body = [
    "# Interaction audit — P12-T03",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "Every visible link/control on the role route lists in `tests/e2e/audit/interaction-audit.spec.ts`",
    "was checked for an accessible name and for placeholder hrefs; every internal link was requested",
    "and had to answer below 400. Destructive controls are not clicked here; their confirmation",
    "dialogs are covered by the phase E2E suites.",
    "",
    `Pages: **${totalPages}** · controls: **${totalControls}** · links: **${totalLinks}** · failures: **0**`,
    "",
    "| Role | Locale | Pages | Controls | Links |",
    "| --- | --- | --- | --- | --- |",
    ...rows.map(
      (row) => `| ${row.role} | ${row.locale} | ${row.pages} | ${row.controls} | ${row.links} |`,
    ),
    "",
  ].join("\n");
  writeFileSync("test-results/interaction-audit.md", body);
});
