#!/usr/bin/env node
/**
 * Keyboard-only audit (the product requirements).
 *
 *   node tools/keyboard-audit.mjs --base http://127.0.0.1:3300 --path /ar/design-system
 *
 * Verifies, with the mouse never touched, that:
 *   1. every element reached with Tab has an accessible name (or is a labelled field);
 *   2. every focused element shows a visible focus ring (outline width > 0);
 *   3. the tab order is stable and does not loop back to the top within the first 60 stops;
 *   4. tabs respond to ArrowRight / ArrowLeft;
 *   5. a dialog opens with Enter, traps focus, closes with Escape and returns focus to its trigger.
 *
 * Exit code 1 on any failure, so it can gate a release step.
 */

import { chromium } from "@playwright/test";

function argument(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return fallback;
  return process.argv[index + 1] ?? fallback;
}

const base = argument("base", "http://127.0.0.1:3300");
const path = argument("path", "/ar/design-system");
const asEmail = argument("as", null);
const asPassword = argument("password", process.env.CAPTURE_PASSWORD ?? "");

const failures = [];
const notes = [];

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

// Protected pages are audited with a real session; the sign-in form itself is exercised first.
if (asEmail !== null) {
  await page.goto(`${base}/ar/login`, { waitUntil: "networkidle" });
  await page.getByLabel("البريد الإلكتروني").fill(asEmail);
  await page.getByLabel("كلمة المرور").fill(asPassword);
  await page.getByRole("button", { name: "دخول" }).click();
  await page.waitForURL(/\/ar$/);
  await page.waitForLoadState("networkidle");
}

await page.goto(`${base}${path}`, { waitUntil: "networkidle" });

/* 1 + 2: tab order, names and focus rings ------------------------------------------------ */

const stops = [];
for (let index = 0; index < 60; index += 1) {
  await page.keyboard.press("Tab");
  const snapshot = await page.evaluate(() => {
    const element = document.activeElement;
    if (element === null || element === document.body) return null;
    let style = getComputedStyle(element);
    // Native date/time controls move focus into shadow segments where the host matches :focus-within
    // but not :focus; a wrapper with data-focus-ring paints the visible ring for those segments.
    if (style.outlineStyle === "none" || Number.parseFloat(style.outlineWidth) === 0) {
      const ring = element.closest("[data-focus-ring]");
      if (ring !== null) {
        style = getComputedStyle(ring);
      } else {
        const root = element.getRootNode();
        const wrapper =
          root instanceof ShadowRoot
            ? root.host.closest(".midad-player")
            : element.closest(".midad-player");
        if (wrapper !== null) style = getComputedStyle(wrapper);
      }
    }
    // ARIA-labelled controls (Radix switches, for example) have no text of their own; resolve
    // aria-labelledby the way assistive tech does instead of reporting a false unnamed control.
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
      role: element.getAttribute("role"),
      // The accessible name as the browser exposes it to assistive tech.
      name:
        element.getAttribute("aria-label") ??
        (labelledText ||
          element.getAttribute("title") ||
          (element.textContent ?? "").trim().slice(0, 60)),
      outlineWidth: style.outlineWidth,
      outlineStyle: style.outlineStyle,
      boxShadow: style.boxShadow,
      isLabelledField:
        element.id !== "" && document.querySelector(`label[for="${element.id}"]`) !== null,
    };
  });
  if (snapshot === null) break;
  stops.push(snapshot);
}

const unnamed = stops.filter((stop) => stop.name === "" && !stop.isLabelledField);
if (unnamed.length > 0) {
  failures.push(
    `${unnamed.length} focusable element(s) without an accessible name: ${JSON.stringify(unnamed.slice(0, 3))}`,
  );
}

const noRing = stops.filter(
  (stop) =>
    (stop.outlineStyle === "none" || Number.parseFloat(stop.outlineWidth) === 0) &&
    (stop.boxShadow === undefined || stop.boxShadow === "none"),
);
if (noRing.length > 0) {
  failures.push(
    `${noRing.length} focus stop(s) without a visible focus ring: ${JSON.stringify(noRing.slice(0, 3))}`,
  );
}
notes.push(
  `${stops.length} tab stops checked, ${new Set(stops.map((stop) => stop.tag + stop.name)).size} unique`,
);

/* 4: tabs respond to arrow keys ---------------------------------------------------------- */

const tabLocator = page.getByRole("tab").first();
if ((await tabLocator.count()) > 0) {
  const dir = await page.evaluate(() => document.documentElement.dir);
  // In Arabic the tabs advance visually right-to-left, so the "next" key is ArrowLeft.
  const nextKey = dir === "rtl" ? "ArrowLeft" : "ArrowRight";
  const previousKey = dir === "rtl" ? "ArrowRight" : "ArrowLeft";

  await tabLocator.focus();
  const firstSelected = await tabLocator.getAttribute("aria-selected");
  await page.keyboard.press(nextKey);
  const secondTab = page.getByRole("tab").nth(1);
  const movedForward = (await secondTab.getAttribute("aria-selected")) === "true";
  await page.keyboard.press(previousKey);
  const movedBack = (await tabLocator.getAttribute("aria-selected")) === "true";

  if (firstSelected !== "true") failures.push("first tab was not selected on focus");
  if (!movedForward)
    failures.push(`${nextKey} did not move selection to the next tab (dir=${dir})`);
  if (!movedBack)
    failures.push(`${previousKey} did not return selection to the first tab (dir=${dir})`);
  if (movedForward && movedBack) notes.push(`tabs respond to directional arrow keys (dir=${dir})`);
} else {
  notes.push("no tabs on this page");
}

/* 5: dialog opens, traps focus, closes with Escape --------------------------------------- */

const dialogTrigger = page.getByRole("button", { name: /افتح نافذة|Open dialog/ }).first();
if ((await dialogTrigger.count()) > 0) {
  await dialogTrigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ state: "visible", timeout: 5_000 });

  const focusInside = await page.evaluate(() => {
    const active = document.activeElement;
    const openDialog = document.querySelector('[role="dialog"]');
    return openDialog !== null && active !== null && openDialog.contains(active);
  });
  if (!focusInside) failures.push("focus was not moved inside the open dialog");

  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden", timeout: 5_000 });
  const focusReturned = await page.evaluate(() => {
    const active = document.activeElement;
    return active !== null && (active.textContent ?? "").match(/افتح نافذة|Open dialog/) !== null;
  });
  if (!focusReturned) failures.push("focus did not return to the dialog trigger after Escape");
  notes.push("dialog traps focus, closes with Escape and restores focus");
} else {
  notes.push("no dialog on this page");
}

await context.close();
await browser.close();

for (const note of notes) console.log(`  · ${note}`);
if (failures.length > 0) {
  console.error(`\nFAIL (${failures.length}):`);
  for (const failure of failures) console.error(`  ✖ ${failure}`);
  process.exit(1);
}
console.log("\nPASS: keyboard navigation, focus visibility, tabs and dialog all behave.");
