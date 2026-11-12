import { expect, test, type Page } from "@playwright/test";

import { fixture, type FixtureUser } from "../e2e/helpers/fixtures";
import { copy, gotoStable, reloadStable, unique, waitForMail } from "./helpers";

/**
 * Journey 5 (§13.3): the learner asks a question, the instructor is notified and replies, the
 * learner receives an in-app and email notification, accepts the answer, then reviews the course.
 */

type Learner = FixtureUser & { courseSlug: string; videoLessonId: string | null };

/** WebKit sometimes ignores the first tab click while the lesson shell is still hydrating. */
async function openQuestionsTab(page: Page, locale: "ar" | "en"): Promise<void> {
  const tab = page.getByRole("tab", {
    name: copy(locale, "الأسئلة والنقاش", "Questions and discussion"),
  });
  // The lesson shell re-renders after hydration; a locator may briefly detach. Retry the click
  // instead of failing on the detached node (seen in WebKit).
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await tab.click();
    } catch {
      // Locator re-resolves on the next attempt.
    }
    if ((await tab.getAttribute("aria-selected").catch(() => null)) === "true") return;
    await page.waitForTimeout(200);
  }
  await expect(tab).toHaveAttribute("aria-selected", "true");
}

for (const locale of ["ar", "en"] as const) {
  test(`question, reply, accepted answer and review in ${locale}`, async ({ page }) => {
    const learner = await fixture<Learner>("/learner", {
      courseSlug: "modern-react-app-development",
      progressPct: 50,
    });
    const token = unique("j5");
    const threadTitle = `${locale === "ar" ? "سؤال الرحلة" : "Journey question"} ${token}`;
    const replyBody = `${locale === "ar" ? "إجابة المدرب على سؤال الرحلة" : "Instructor reply to the journey question"} ${token}.`;
    const reviewBody = `${locale === "ar" ? "مراجعة رحلة كاملة: شرح واضح" : "Full journey review: clear explanations"} ${token}.`;
    const lessonPath = `/${locale}/learn/${learner.courseSlug}/${learner.videoLessonId ?? ""}`;

    const learnerSignIn = await page.request.post("/api/auth/sign-in/email", {
      headers: { origin: "http://127.0.0.1:3100" },
      data: { email: learner.email, password: learner.password },
    });
    expect(learnerSignIn.ok()).toBe(true);
    await gotoStable(page, lessonPath);
    await openQuestionsTab(page, locale);
    await page.getByRole("button", { name: copy(locale, "اطرح سؤالًا", "Ask a question") }).click();
    await page.locator("#thread-title").fill(threadTitle);
    await page
      .locator("#thread-body")
      .fill(
        locale === "ar"
          ? "كيف أفرّق بين الحالة المحلية والسياق في مثال عملي؟"
          : "How do local state and context differ in practice?",
      );
    await page.getByRole("button", { name: copy(locale, "انشر السؤال", "Post question") }).click();
    await expect(page.getByText(threadTitle)).toBeVisible({ timeout: 30_000 });

    await page.context().clearCookies();
    const instructorSignIn = await page.request.post("/api/auth/sign-in/email", {
      headers: { origin: "http://127.0.0.1:3100" },
      data: { email: "instructor.demo@midad.test", password: learner.password },
    });
    expect(instructorSignIn.ok()).toBe(true);
    await gotoStable(page, `/${locale}/notifications`);
    await expect(page.getByText(threadTitle).first()).toBeVisible({ timeout: 20_000 });

    await gotoStable(page, lessonPath);
    await openQuestionsTab(page, locale);
    const question = page.locator("li").filter({ hasText: threadTitle }).first();
    await question.locator('input[name="reply"], textarea[name="reply"]').last().fill(replyBody);
    await question
      .getByRole("button", { name: copy(locale, "رد", "Reply") })
      .last()
      .click();
    await expect(page.getByText(replyBody)).toBeVisible({ timeout: 20_000 });

    await page.context().clearCookies();
    const secondLearnerSignIn = await page.request.post("/api/auth/sign-in/email", {
      headers: { origin: "http://127.0.0.1:3100" },
      data: { email: learner.email, password: learner.password },
    });
    expect(secondLearnerSignIn.ok()).toBe(true);
    await gotoStable(page, `/${locale}/notifications`);
    await expect(page.getByText(threadTitle).first()).toBeVisible({ timeout: 20_000 });
    await waitForMail(learner.email, locale === "ar" ? "ردّ جديد على سؤالك" : "New reply");

    await gotoStable(page, lessonPath);
    await openQuestionsTab(page, locale);
    const acceptedQuestion = page.locator("li").filter({ hasText: threadTitle }).first();
    await acceptedQuestion
      .getByRole("button", { name: copy(locale, "اعتمد كإجابة", "Accept as answer") })
      .first()
      .click();
    await expect(
      page.getByText(copy(locale, "إجابة معتمدة", "Accepted answer")).first(),
    ).toBeVisible({ timeout: 20_000 });
    // Accepting triggers router.refresh(); in Firefox an immediate navigation aborts that refresh.
    await page.waitForLoadState("networkidle");

    // The accepted-answer refresh can abort the next document request on Firefox/WebKit; the
    // shared helper retries that and waits for hydration before the review form is touched.
    await gotoStable(page, `/${locale}/courses/modern-react-app-development`);
    await page.getByLabel(copy(locale, "5 من 5", "5 of 5")).check();
    await page.locator('textarea[id^="review-body-"]').first().fill(reviewBody);
    await page
      .getByRole("button", {
        name: new RegExp(copy(locale, "انشر التقييم|حدّث التقييم", "Publish review|Update review")),
      })
      .click();
    await expect(
      page.getByText(copy(locale, "حُفظ تقييمك.", "Your review was saved.")),
    ).toBeVisible({ timeout: 20_000 });
    // WebKit can lag behind router.refresh(); a reload proves the review was persisted. The
    // router refresh may still be in flight, so retry an aborted document request.
    await reloadStable(page);
    await expect(page.getByRole("paragraph").filter({ hasText: reviewBody }).first()).toBeVisible({
      timeout: 20_000,
    });
  });
}
