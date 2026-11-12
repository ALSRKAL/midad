#!/usr/bin/env node
/**
 * Browser-protocol screenshot capture (the product requirements).
 *
 *   node tools/capture.mjs --task P01-T04 --path / --name boot
 *   node tools/capture.mjs --task P01-T05 --path /design-system --name design-system
 *
 * Captures the mandatory matrix for one page: both locales × both widths × both themes, into
 * `docs/screenshots/<task>/<name>-<locale>-<width>-<theme>.png`. The theme is applied before the
 * first paint through localStorage, exactly like a returning visitor's browser would.
 *
 * Requires a running server: `pnpm build && pnpm start --port 3100`.
 */

import { mkdir } from "node:fs/promises";
import { join } from "node:path";

import { chromium } from "@playwright/test";

function argument(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return fallback;
  return process.argv[index + 1] ?? fallback;
}

const task = argument("task", "scratch");
const path = argument("path", "/");
const name = argument("name", "page");
const baseUrl = argument("base", process.env.CAPTURE_BASE_URL ?? "http://127.0.0.1:3100");
// Settings and other protected pages need a real session; pass a seeded account to capture them.
const asEmail = argument("as", null);
const asPassword = argument("password", process.env.CAPTURE_PASSWORD ?? "");

const locales = ["ar", "en"];
const widths = [1440, 375];
const themes = ["light", "dark"];

/** Signs the context in through the real form so the session cookie is exactly a user's. */
async function signIn(page) {
  await page.goto(`${baseUrl}/ar/login`, { waitUntil: "networkidle" });
  await page.getByLabel("البريد الإلكتروني").fill(asEmail);
  await page.getByLabel("كلمة المرور").fill(asPassword);
  await page.getByRole("button", { name: "دخول" }).click();
  await page.waitForURL(/\/ar$/);
  // Let the client navigation after sign-in settle before the caller navigates again.
  await page.waitForLoadState("networkidle");
}

const outDir = join(process.cwd(), "docs", "screenshots", task);
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const results = [];

for (const locale of locales) {
  for (const width of widths) {
    for (const theme of themes) {
      const context = await browser.newContext({
        viewport: { width, height: width === 375 ? 812 : 900 },
        deviceScaleFactor: 1,
        colorScheme: theme,
        locale: locale === "ar" ? "ar-SA" : "en-US",
        reducedMotion: "reduce",
      });
      await context.addInitScript((value) => localStorage.setItem("midad-theme", value), theme);
      const page = await context.newPage();
      const consoleErrors = [];
      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text());
      });
      page.on("pageerror", (error) => consoleErrors.push(error.message));

      if (asEmail !== null) await signIn(page);

      // The path is locale-agnostic; the locale prefix is added here so every screenshot is taken
      // in the language it claims to show.
      const route = path.startsWith("/") ? path : `/${path}`;
      const target = `${baseUrl}/${locale}${route === "/" ? "" : route}`;
      const response = await page.goto(target, { waitUntil: "networkidle" });

      // A 404 page legitimately logs one 404 for the document itself; that is the page working.
      const status = response?.status() ?? 0;
      const relevantErrors =
        status === 404
          ? consoleErrors.filter((message) => !/status of 404/.test(message))
          : consoleErrors;

      const dir = await page.evaluate(() => document.documentElement.dir);
      const appliedTheme = await page.evaluate(() => document.documentElement.className);
      const horizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );

      const file = join(outDir, `${name}-${locale}-${width}-${theme}.png`);
      await page.screenshot({ path: file, fullPage: true });

      results.push({
        file: file.replace(`${process.cwd()}/`, ""),
        locale,
        width,
        theme,
        dir,
        themeClass: appliedTheme.includes("dark") ? "dark" : "light",
        status,
        overflow: horizontalOverflow,
        consoleErrors: relevantErrors.length,
        errorMessages: relevantErrors.slice(0, 3),
      });

      await context.close();
    }
  }
}

await browser.close();

for (const result of results) {
  console.log(
    `${result.file} · ${result.locale}/${result.width}/${result.theme} · dir=${result.dir} · class=${result.themeClass} · ${result.status} · overflow=${result.overflow} · consoleErrors=${result.consoleErrors}`,
  );
  for (const message of result.errorMessages) console.log(`   ↳ ${message}`);
}

const problems = results.filter(
  (result) => result.themeClass !== result.theme || result.overflow > 1 || result.consoleErrors > 0,
);
if (problems.length > 0) {
  console.error(
    `\n${problems.length} capture(s) have problems (theme mismatch, overflow, console errors).`,
  );
  process.exit(1);
}
console.log(`\n${results.length} screenshots captured into docs/screenshots/${task}/`);
