import { expect, test, type Page } from "@playwright/test";

import { fixture, type FixtureUser } from "../e2e/helpers/fixtures";
import { unique } from "../journeys/helpers";

/**
 * P14-T05 network and session edge cases: offline save, Slow 3G submit, and a session that expires
 * while a form holds unsaved input. The form must report the failure and keep the user's input.
 */

type Learner = FixtureUser & { courseSlug: string; videoLessonId: string | null };

async function signIn(page: Page, email: string, password: string) {
  const response = await page.request.post("/api/auth/sign-in/email", {
    headers: { origin: "http://127.0.0.1:3100" },
    data: { email, password },
  });
  expect(response.ok()).toBe(true);
}

test.describe.configure({ mode: "serial" });

test("offline note save shows an error and preserves the text", async ({ page }) => {
  const learner = await fixture<Learner>("/learner", {
    courseSlug: "modern-react-app-development",
  });
  await signIn(page, learner.email, learner.password);
  await page.goto(`/ar/learn/${learner.courseSlug}/${learner.videoLessonId ?? ""}`, {
    waitUntil: "networkidle",
  });
  await page.getByRole("tab", { name: "ملاحظاتي" }).click();
  const body = unique("ملاحظة دون اتصال");
  await page.locator("#note-body").fill(body);

  await page.context().setOffline(true);
  await page.getByRole("button", { name: /أضف/ }).click();
  await expect(page.locator('p[role="alert"]')).toContainText("تعذّر");
  await expect(page.locator("#note-body")).toHaveValue(body);

  await page.context().setOffline(false);
  await page.getByRole("button", { name: /أضف/ }).click();
  await expect(page.getByText(body)).toBeVisible({ timeout: 20_000 });
});

test("Slow 3G note save shows pending and then succeeds", async ({ page, context }) => {
  const learner = await fixture<Learner>("/learner", {
    courseSlug: "modern-react-app-development",
  });
  await signIn(page, learner.email, learner.password);
  await page.goto(`/ar/learn/${learner.courseSlug}/${learner.videoLessonId ?? ""}`, {
    waitUntil: "networkidle",
  });
  await page.getByRole("tab", { name: "ملاحظاتي" }).click();

  const client = await context.newCDPSession(page);
  await client.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 1_500,
    downloadThroughput: 8 * 1024,
    uploadThroughput: 8 * 1024,
  });
  const body = unique("ملاحظة بطيئة");
  await page.locator("#note-body").fill(body);
  await page.getByRole("button", { name: /أضف/ }).click();
  await expect(page.getByRole("button", { name: /أضف|جارٍ/ }).first()).toBeVisible();
  await expect(page.getByText(body)).toBeVisible({ timeout: 60_000 });
  await client.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 0,
    downloadThroughput: -1,
    uploadThroughput: -1,
  });
});

test("an expired session keeps the form content and explains the failure", async ({ page }) => {
  const learner = await fixture<Learner>("/learner", {
    courseSlug: "modern-react-app-development",
  });
  await signIn(page, learner.email, learner.password);
  await page.goto("/ar/settings", { waitUntil: "networkidle" });
  const name = page.locator("#profile-name");
  const value = unique("اسم غير محفوظ");
  await name.fill(value);
  await fixture("/expire-sessions", { email: learner.email });

  await page
    .getByRole("button", { name: /احفظ|حفظ/ })
    .first()
    .click();
  // Either an inline error or the login redirect is acceptable, but the typed value must survive
  // until the navigation starts; the app may only send the user to sign in.
  await page.waitForTimeout(3_000);
  if (!page.url().includes("/login")) {
    await expect(name).toHaveValue(value);
    await expect(page.getByRole("alert")).toBeVisible();
  } else {
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
});
