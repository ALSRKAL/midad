#!/usr/bin/env node
/**
 * Accessibility audit with axe-core (the product requirements, §13.5).
 *
 *   node tools/axe.mjs --base http://127.0.0.1:3200 --paths /ar,/en,/ar/design-system
 *
 * Fails (exit 1) on any `serious` or `critical` violation, which is the project's threshold.
 * Runs with the same reduced-motion and locale settings as the screenshot capture.
 */

import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

function argument(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return fallback;
  return process.argv[index + 1] ?? fallback;
}

const base = argument("base", "http://127.0.0.1:3200");
const paths = argument("paths", "/ar,/en")
  .split(",")
  .map((path) => path.trim());
const themes = (argument("themes", "light,dark") ?? "light,dark").split(",");
const asEmail = argument("as", null);
const asPassword = argument("password", process.env.CAPTURE_PASSWORD ?? "");

const BLOCKING = new Set(["serious", "critical"]);
const browser = await chromium.launch();
let failures = 0;
const summary = [];

for (const path of paths) {
  for (const theme of themes) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      colorScheme: theme,
      reducedMotion: "reduce",
    });
    await context.addInitScript((value) => localStorage.setItem("midad-theme", value), theme);
    const page = await context.newPage();

    // Protected pages are audited as a signed-in learner, through the real sign-in form.
    if (asEmail !== null) {
      await page.goto(`${base}/ar/login`, { waitUntil: "networkidle" });
      await page.getByLabel("البريد الإلكتروني").fill(asEmail);
      await page.getByLabel("كلمة المرور").fill(asPassword);
      await page.getByRole("button", { name: "دخول" }).click();
      await page.waitForURL(/\/ar$/);
    }

    const response = await page.goto(`${base}${path}`, { waitUntil: "networkidle" });

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    const blocking = results.violations.filter((violation) =>
      BLOCKING.has(violation.impact ?? "minor"),
    );
    const violations = results.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      nodes: violation.nodes.length,
      help: violation.help,
      targets: violation.nodes.slice(0, 6).map((node) => node.target.join(" ")),
      summaries: violation.nodes
        .slice(0, 3)
        .map((node) => node.failureSummary?.split("\n")[1]?.trim() ?? ""),
    }));

    failures += blocking.length;
    summary.push({
      path,
      theme,
      status: response?.status() ?? "?",
      violations,
      blocking: blocking.length,
    });

    await context.close();
  }
}

await browser.close();

for (const row of summary) {
  const list = row.violations.length
    ? row.violations
        .map((violation) => `${violation.id}(${violation.impact}×${violation.nodes})`)
        .join(", ")
    : "none";
  console.log(
    `${row.path} · ${row.theme} · ${row.status} · serious/critical=${row.blocking} · ${list}`,
  );
  for (const violation of row.violations) {
    if (BLOCKING.has(violation.impact ?? "minor")) {
      console.log(`   ↳ ${violation.id}: ${violation.help}`);
      for (const target of violation.targets) console.log(`      target: ${target}`);
      for (const detail of violation.summaries.filter(Boolean))
        console.log(`      detail: ${detail}`);
    }
  }
}

if (failures > 0) {
  console.error(`\nFAIL: ${failures} serious/critical violation(s).`);
  process.exit(1);
}
console.log(
  `\nPASS: no serious or critical violations across ${summary.length} page/theme combinations.`,
);
