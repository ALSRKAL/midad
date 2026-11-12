import { expect, test, type Page } from "@playwright/test";

import { fixture, type FixtureUser } from "./helpers/fixtures";

/**
 * Engagement journeys (P09): eligible review + edit, instructor reply, notifications and a course
 * announcement delivered through the queued email pipeline. Each project owns its learner and the
 * review text is unique, so replies and notifications never collide across engines (P14-T01).
 */

const COURSE = "/ar/courses/modern-react-app-development";
let learner: FixtureUser;
let PASSWORD = "";
let REVIEW_TEXT = "";
let EDITED_TEXT = "";
let REPLY_TEXT = "";

test.beforeAll(async () => {
  learner = await fixture<FixtureUser>("/learner", {
    courseSlug: "modern-react-app-development",
    progressPct: 50,
  });
  PASSWORD = learner.password;
  const suffix = Date.now().toString(36);
  REVIEW_TEXT = `مراجعة من اختبار المتصفح ${suffix}: شرح واضح وأمثلة عملية.`;
  EDITED_TEXT = `مراجعة معدّلة من اختبار المتصفح ${suffix}.`;
  // Replies from earlier runs stay on the course page; a fixed string makes the assertion match
  // several paragraphs (strict-mode violation). Keep the reply unique like the review (P15-T01).
  REPLY_TEXT = `شكرًا لك، أضفنا أمثلة إضافية في الدرس القادم. ${suffix}`;
});

test.describe.configure({ mode: "serial" });

async function signIn(page: Page, email: string): Promise<void> {
  const response = await page.request.post("/api/auth/sign-in/email", {
    headers: { origin: "http://127.0.0.1:3100" },
    data: { email, password: PASSWORD },
  });
  expect(response.ok(), `sign-in for ${email}`).toBe(true);
}

test("an eligible learner publishes and edits a review", async ({ page }) => {
  await signIn(page, learner.email);
  await page.goto(COURSE, { waitUntil: "networkidle" });

  const body = page.locator('textarea[id^="review-body-"]').first();
  await expect(body).toBeVisible();
  await page.getByLabel("5 من 5").check();
  await body.fill(REVIEW_TEXT);
  await page.getByRole("button", { name: /انشر التقييم|حدّث التقييم/ }).click();
  await expect(page.getByText("حُفظ تقييمك.")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("paragraph").filter({ hasText: REVIEW_TEXT })).toBeVisible();

  await body.fill(EDITED_TEXT);
  await page.getByRole("button", { name: "حدّث التقييم" }).click();
  await expect(page.getByRole("paragraph").filter({ hasText: EDITED_TEXT })).toBeVisible();
});

test("the instructor replies and the learner receives a notification", async ({ page }) => {
  await signIn(page, "instructor.demo@midad.test");
  await page.goto(COURSE, { waitUntil: "networkidle" });

  const reviewItem = page.locator("li").filter({ hasText: EDITED_TEXT });
  const replyBox = reviewItem.locator('textarea[id^="reply-"]').first();
  await expect(replyBox).toBeVisible();
  await replyBox.fill(REPLY_TEXT);
  await reviewItem.getByRole("button", { name: "أضف الرد" }).click();
  await expect(page.getByRole("paragraph").filter({ hasText: REPLY_TEXT })).toBeVisible();
});

test("the learner sees the reply in notifications and can mark it read", async ({ page }) => {
  await signIn(page, learner.email);
  await page.goto("/ar/notifications", { waitUntil: "networkidle" });

  const notification = page.locator("li").filter({ hasText: "ردّ المدرب على تقييمك" }).first();
  await expect(notification).toBeVisible();
  await notification.getByRole("button", { name: "علّم كمقروء" }).click();
  await expect(notification.getByRole("button", { name: "علّم كمقروء" })).toHaveCount(0);
});

test("an announcement reaches the enrolled learner in-app and by email", async ({ page }) => {
  await signIn(page, "instructor.demo@midad.test");
  await page.goto("/ar/instructor/announcements", { waitUntil: "networkidle" });

  // Unique per run: earlier runs leave announcements in the list and the worker mailbox.
  const title = `إعلان اختبار ${Date.now()}`;
  await page
    .locator("#announcement-course")
    .selectOption({ label: "تطبيقات React الحديثة: من المكوّن إلى النشر" });
  await page.locator("#announcement-title").fill(title);
  await page
    .locator("#announcement-body")
    .fill("أضفنا تحديثًا جديدًا إلى الدورة، راجعوا الدرس الأخير.");
  await page.getByRole("button", { name: "أرسل الإعلان" }).click();
  await expect(page.getByText("أُرسل الإعلان وأُشعر المتعلمون.")).toBeVisible();
  await expect(page.getByText(title).first()).toBeVisible();

  // The worker sends the queued bilingual announcement to the enrolled fixture learner.
  // Search by the unique subject: the shared mailbox holds thousands of messages from earlier
  // runs, so a fixed "latest 100" window loses this announcement (P15-T01 zero-flaky).
  const mailQuery = new URLSearchParams({ query: `subject:"${title}"` });
  let delivered = false;
  for (let attempt = 0; attempt < 15 && !delivered; attempt += 1) {
    const mailpit = await page.request.get(
      `http://127.0.0.1:8025/api/v1/search?${mailQuery.toString()}`,
    );
    const mailbox = (await mailpit.json()) as {
      messages: Array<{ To: Array<{ Address: string }>; Subject: string }>;
    };
    delivered = mailbox.messages.some(
      (message) =>
        message.Subject.includes(title) && message.To.some((to) => to.Address === learner.email),
    );
    if (!delivered) await page.waitForTimeout(1000);
  }
  expect(delivered, "announcement email").toBe(true);

  await signIn(page, learner.email);
  await page.goto("/ar/notifications", { waitUntil: "networkidle" });
  await expect(page.getByText(title).first()).toBeVisible();
});
