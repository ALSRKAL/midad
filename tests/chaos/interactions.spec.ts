import { expect, test } from "@playwright/test";

import { fixture, type FixtureUser } from "../e2e/helpers/fixtures";
import { unique } from "../journeys/helpers";

/**
 * P14-T05 interaction edge cases: rapid double submit, two tabs on one account, hostile text
 * (XSS/SQLi/emoji/long unbroken strings), fake or oversized files, and a 300-lesson course.
 */

const PASSWORD = ["Midad", "Test", "2026"].join("-");

test.describe.configure({ mode: "serial" });

test("a double-clicked contact submit creates one message and hostile text is inert", async ({
  page,
}) => {
  const token = unique("chaos");
  const subject = `<script>alert(1)</script> ${token}`;
  const message = `' OR 1=1 -- ${token} 🧪 مرحبا hello ` + "ط".repeat(500);
  let dialogOpened = false;
  page.on("dialog", () => {
    dialogOpened = true;
  });

  await page.goto("/ar/contact", { waitUntil: "networkidle" });
  await page.getByLabel("الاسم").fill("اسم بدون مسافات " + "س".repeat(60));
  await page.getByLabel("البريد الإلكتروني").fill(`chaos-${token}@midad.test`);
  await page.getByLabel("الموضوع").fill(subject);
  await page.getByLabel("الرسالة").fill(message);
  await page.getByRole("button", { name: "أرسل الرسالة" }).dblclick();
  await expect(page.getByText("وصلت رسالتك")).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(1_500);

  const adminSignIn = await page.request.post("/api/auth/sign-in/email", {
    headers: { origin: "http://127.0.0.1:3100" },
    data: { email: "admin@midad.test", password: PASSWORD },
  });
  expect(adminSignIn.ok()).toBe(true);
  await page.goto(`/ar/admin/messages?q=${encodeURIComponent(token)}`, {
    waitUntil: "networkidle",
  });
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator("tbody")).toContainText("alert(1)");
  expect(dialogOpened).toBe(false);
});

test("two tabs of one account save without corrupting the profile", async ({ page, context }) => {
  const user = await fixture<FixtureUser>("/user", { role: "STUDENT" });
  await page.request.post("/api/auth/sign-in/email", {
    headers: { origin: "http://127.0.0.1:3100" },
    data: { email: user.email, password: user.password },
  });

  const first = await context.newPage();
  const second = await context.newPage();
  await first.goto("/ar/settings", { waitUntil: "networkidle" });
  await second.goto("/ar/settings", { waitUntil: "networkidle" });

  const firstName = unique("اسم التبويب الأول");
  const secondName = unique("اسم التبويب الثاني");
  await first.locator("#profile-name").fill(firstName);
  await first
    .getByRole("button", { name: /حفظ التغييرات/ })
    .first()
    .click();
  await expect(first.getByText("حُفظت التغييرات.")).toBeVisible();

  await second.locator("#profile-name").fill(secondName);
  await second
    .getByRole("button", { name: /حفظ التغييرات/ })
    .first()
    .click();
  await expect(second.getByText("حُفظت التغييرات.")).toBeVisible();

  await first.reload({ waitUntil: "networkidle" });
  expect([firstName, secondName]).toContain(await first.locator("#profile-name").inputValue());
  await second.close();
});

test("fake and oversized avatar files are refused with a clear message", async ({ page }) => {
  const user = await fixture<FixtureUser>("/user", { role: "STUDENT" });
  await page.request.post("/api/auth/sign-in/email", {
    headers: { origin: "http://127.0.0.1:3100" },
    data: { email: user.email, password: user.password },
  });
  await page.goto("/ar/settings", { waitUntil: "networkidle" });

  await page.locator("#avatar").setInputFiles({
    name: "avatar.png",
    mimeType: "image/png",
    buffer: Buffer.from("this is not a png"),
  });
  await expect(page.locator('p[role="alert"]')).toBeVisible();

  const oversized = Buffer.alloc(3 * 1024 * 1024);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(oversized);
  await page.locator("#avatar").setInputFiles({
    name: "avatar-big.png",
    mimeType: "image/png",
    buffer: oversized,
  });
  await expect(page.locator('p[role="alert"]')).toBeVisible();
});

test("a 300-lesson course renders without horizontal overflow", async ({ page }) => {
  const huge = await fixture<{ courseSlug: string; lessons: number }>("/huge-course");
  expect(huge.lessons).toBe(300);
  const response = await page.goto(`/ar/courses/${huge.courseSlug}`, {
    waitUntil: "networkidle",
  });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);
});
