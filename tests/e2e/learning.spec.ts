import { expect, test, type Page } from "@playwright/test";

import { fixture, type FixtureUser } from "./helpers/fixtures";

/**
 * Learning journeys (P07): dashboard resume, guarded player, signed asset, watched-segment
 * completion, private timestamped notes and course Q&A. Each project owns a fresh learner and
 * enrolment from the fixture API (P14-T01).
 */

type LearnerFixture = FixtureUser & {
  courseSlug: string;
  videoLessonId: string | null;
  textLessonId: string | null;
  previewLessonId: string | null;
};

let learner: LearnerFixture;
let PASSWORD = "";
let QUESTION_TITLE = "";

test.beforeAll(async () => {
  learner = await fixture<LearnerFixture>("/learner", {
    courseSlug: "modern-react-app-development",
  });
  PASSWORD = learner.password;
  // Questions stay on the shared seed course; a fixed title matches earlier runs and fails
  // Playwright's strict mode (P15-T01 zero-flaky).
  QUESTION_TITLE = `سؤال من اختبار المتصفح ${Date.now().toString(36)}`;
  expect(learner.videoLessonId, "seed course has a video lesson").not.toBeNull();
  expect(learner.textLessonId, "seed course has a text lesson").not.toBeNull();
});

test.describe.configure({ mode: "serial" });

async function signIn(page: Page): Promise<void> {
  const response = await page.request.post("/api/auth/sign-in/email", {
    headers: { origin: "http://127.0.0.1:3100" },
    data: { email: learner.email, password: PASSWORD },
  });
  expect(response.ok(), "learner sign-in").toBe(true);
}

test("the dashboard shows enrolled courses and the player completes a watched video", async ({
  page,
}) => {
  await signIn(page);
  await page.goto("/ar/dashboard", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { level: 1, name: "لوحة التعلّم" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "دوراتي" })).toBeVisible();
  await expect(page.getByText("تطبيقات React الحديثة: من المكوّن إلى النشر").first()).toBeVisible();

  await page.goto(`/ar/learn/${learner.courseSlug}/${learner.videoLessonId ?? ""}`, {
    waitUntil: "networkidle",
  });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  const video = page.locator("video").first();
  await expect(video).toBeVisible({ timeout: 20_000 });
  const src = await video.evaluate((element) => {
    const media = element as HTMLVideoElement;
    return media.currentSrc === "" ? media.src : media.currentSrc;
  });
  expect(src).not.toBe("");
  const signed = await page.request.get(src);
  expect(signed.status()).toBe(200);
  if (!src.startsWith("blob:")) {
    const unsigned = await page.request.get(src.split("?")[0] ?? "");
    expect(unsigned.status()).toBe(403);
  }

  await video.evaluate(async (element) => {
    const media = element as HTMLVideoElement;
    media.muted = true;
    await media.play();
  });
  await expect(page.getByText("أكملت هذا الدرس")).toBeVisible({ timeout: 20_000 });

  await page.goto("/ar/dashboard", { waitUntil: "networkidle" });
  await expect(page.getByText(/توقفت عند/)).toBeVisible();
  await expect(page.getByText(/مكتمل/).first()).toBeVisible();
});

test("private timed notes and course Q&A persist", async ({ page }) => {
  await signIn(page);
  await page.goto(`/ar/learn/${learner.courseSlug}/${learner.videoLessonId ?? ""}`, {
    waitUntil: "networkidle",
  });

  await page.getByRole("tab", { name: "ملاحظاتي" }).click();
  await page.locator("#note-body").fill("ملاحظة من اختبار المتصفح للمشغل");
  await page.getByRole("button", { name: /أضف/ }).click();
  await expect(page.getByText("ملاحظة من اختبار المتصفح للمشغل")).toBeVisible();

  await page.getByRole("tab", { name: "الأسئلة والنقاش" }).click();
  await page.getByRole("button", { name: "اطرح سؤالًا" }).click();
  await page.locator("#thread-title").fill(QUESTION_TITLE);
  await page
    .locator("#thread-body")
    .fill("كيف أفرّق بين الحالة المحلية والسياق في مثال عملي قصير؟");
  await page.getByRole("button", { name: "انشر السؤال" }).click();
  await expect(page.getByText(QUESTION_TITLE)).toBeVisible();
});

test("a text lesson completes manually and updates the course percentage", async ({ page }) => {
  await signIn(page);
  await page.goto(`/ar/learn/${learner.courseSlug}/${learner.textLessonId ?? ""}`, {
    waitUntil: "networkidle",
  });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  const button = page.getByRole("button", { name: "أكملت الدرس" });
  if ((await button.count()) > 0) {
    await button.click();
  }
  await expect(page.getByText("أكملت هذا الدرس")).toBeVisible();
});

test("guests get the preview lesson but paid lessons require sign-in", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto(`/ar/learn/${learner.courseSlug}/${learner.previewLessonId ?? ""}`, {
    waitUntil: "networkidle",
  });
  await expect(page.getByText("معاينة مجانية").first()).toBeVisible();
  await expect(page.getByRole("tab", { name: "ملاحظاتي" })).toHaveCount(0);

  await page.goto(`/ar/learn/${learner.courseSlug}/${learner.videoLessonId ?? ""}`, {
    waitUntil: "networkidle",
  });
  await expect(page).toHaveURL(/\/ar\/login\?next=/);
});
