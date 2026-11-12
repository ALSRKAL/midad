import { expect, test } from "@playwright/test";

/**
 * P12-T02 cross-browser smoke: the public catalogue, search, course page, locale switch and the
 * login error path on Chromium, Firefox, WebKit, Pixel 7 and iPhone 14. Mutation journeys remain in
 * their phase suites on Chromium because they share seeded fixtures.
 */

test("public journey works on this engine", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/ar", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.dir)).toBe("rtl");

  const search = page.getByRole("combobox", { name: "ابحث عن دورة" });
  await search.fill("react");
  // WebKit's datalist submit path is engine-specific; navigation is exercised via the URL here and
  // the form submit itself is covered by the Chromium catalog suite.
  await page.goto("/ar/courses?q=react", { waitUntil: "networkidle" });
  await expect(page.getByRole("link", { name: /React/ }).first()).toBeVisible();

  await page.goto("/ar/courses/modern-react-app-development", { waitUntil: "networkidle" });
  await expect(
    page.getByRole("heading", { level: 1, name: /تطبيقات React الحديثة/ }),
  ).toBeVisible();

  await page.goto("/en/courses", { waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    ),
  ).toBe(0);

  await page.goto("/ar/login", { waitUntil: "networkidle" });
  await page.getByLabel("البريد الإلكتروني").fill("nobody@midad.test");
  await page.getByLabel("كلمة المرور").fill("wrong-password-123");
  await page.getByRole("button", { name: "دخول" }).click();
  // Error-copy behavior is asserted by the Chromium auth suite; here we only prove the form renders
  // and submits without a crash in Gecko/WebKit.
  await expect(page.getByRole("button", { name: "دخول" })).toBeVisible();
  expect(
    errors.filter(
      (message) =>
        !message.includes("401") &&
        !message.includes("403") &&
        // WebKit reports Next's background RSC prefetch as an access-control console message even
        // when the same-origin navigation succeeds; it is engine noise, not a failed page.
        !message.includes("due to access control checks"),
    ),
  ).toEqual([]);
});
