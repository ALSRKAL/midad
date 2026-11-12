import { expect, test, type Page } from "@playwright/test";

/**
 * On narrow viewports the header collapses language and appearance into the drawer, exactly like a
 * real phone user sees it. Tests must therefore open the drawer before reaching those controls.
 */
async function openNavigationIfCollapsed(page: Page): Promise<void> {
  const trigger = page.getByRole("button", { name: /افتح القائمة|Open menu/ });
  if (await trigger.isVisible()) {
    await trigger.click();
    await page.getByRole("dialog").waitFor({ state: "visible" });
  }
}

/**
 * P00-T09 / P01-T03 smoke tests: the shell boots in both locales with the correct direction, the
 * locale switch keeps the visitor on the same page, and nothing logs an error.
 */
test.describe("localized shell", () => {
  test("serves Arabic first and redirects the root there", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/ar$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("تعلّم مهارة");
  });

  test("renders English in LTR with translated copy", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(error.message));

    const response = await page.goto("/en");
    expect(response?.status()).toBe(200);

    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Learn a skill");
    await expect(page.getByRole("heading", { level: 2, name: "Browse by field" })).toBeVisible();

    expect(consoleErrors, `console errors:\n${consoleErrors.join("\n")}`).toEqual([]);
  });

  test("switches language without leaving the page", async ({ page }) => {
    await page.goto("/ar");
    await openNavigationIfCollapsed(page);
    await page.getByRole("link", { name: "تغيير اللغة إلى الإنجليزية" }).click();
    await expect(page).toHaveURL(/\/en$/);
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.getByRole("heading", { level: 2, name: "Browse by field" })).toBeVisible();
  });

  test("never scrolls horizontally in either direction", async ({ page }) => {
    for (const path of ["/ar", "/en"]) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${path} must not scroll horizontally`).toBeLessThanOrEqual(1);
    }
  });

  test("opens the mobile drawer, traps focus and closes with Escape", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/ar");

    const trigger = page.getByRole("button", { name: "افتح القائمة" });
    await trigger.click();

    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible();
    await expect(page.getByRole("navigation", { name: "القائمة" })).toBeVisible();

    const focusInside = await page.evaluate(() => {
      const active = document.activeElement;
      const dialog = document.querySelector('[role="dialog"]');
      return dialog !== null && active !== null && dialog.contains(active);
    });
    expect(focusInside).toBe(true);

    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("applies the design tokens to the page background", async ({ page }) => {
    await page.goto("/ar");
    const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(background).toBe("rgb(250, 248, 244)");
  });

  test("uses the self-hosted typefaces, not a system fallback", async ({ page }) => {
    await page.goto("/ar");
    const bodyFont = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    const headingFont = await page.evaluate(
      () => getComputedStyle(document.querySelector("h1") ?? document.body).fontFamily,
    );
    // next/font exposes generated family names; a system fallback would not contain them.
    expect(bodyFont).toMatch(/__IBM_Plex_Sans_Arabic|IBM Plex Sans Arabic/);
    expect(headingFont).toMatch(/__Readex_Pro|Readex Pro/);
  });

  test("switches to the dark theme and remembers it after a reload", async ({ page }) => {
    await page.goto("/ar");
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(
      "rgb(250, 248, 244)",
    );

    await openNavigationIfCollapsed(page);
    await page.getByRole("button", { name: "داكن" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(
      "rgb(14, 18, 23)",
    );

    await page.reload();
    await expect(page.locator("html")).toHaveClass(/dark/);
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(
      "rgb(14, 18, 23)",
    );
  });
});
