import { expect, test } from "@playwright/test";

import { fixture, type FixtureAssessment } from "../e2e/helpers/fixtures";
import { copy, gotoStable, startVideoPlayback } from "./helpers";

/**
 * Journey 3 (§13.3): a learner completes a video, a text lesson and a quiz (failing once, then
 * passing), receives a certificate, downloads its PDF and verifies it in a logged-out browser.
 *
 * Playwright's WebKit build plays the seeded HLS through hls.js (MSE), so this journey runs on all
 * engines; docs/TEST_PLAN.md §4 records the media matrix.
 */

for (const locale of ["ar", "en"] as const) {
  test(`complete a course and verify the certificate in ${locale}`, async ({ page, browser }) => {
    test.setTimeout(300_000);
    const assessment = await fixture<FixtureAssessment>("/assessment", { video: true });
    const signIn = await page.request.post("/api/auth/sign-in/email", {
      headers: { origin: "http://127.0.0.1:3100" },
      data: { email: assessment.email, password: assessment.password },
    });
    expect(signIn.ok()).toBe(true);
    expect(assessment.videoLessonId, "video lesson").not.toBeNull();

    await gotoStable(
      page,
      `/${locale}/learn/${assessment.courseSlug}/${assessment.videoLessonId ?? ""}`,
    );
    const video = await startVideoPlayback(page);
    const completion = page.getByText(copy(locale, "أكملت هذا الدرس", "You completed this lesson"));
    // HLS can pause while the worker and the rest of the matrix compete for the host. Nudge a
    // paused player and keep watching; the clock still has to reach the 90% threshold.
    const deadline = Date.now() + 60_000;
    while (Date.now() < deadline) {
      if (await completion.isVisible().catch(() => false)) break;
      await video.evaluate((element) => {
        const media = element as HTMLVideoElement;
        if (!media.ended && media.paused) {
          media.muted = true;
          void media.play().catch(() => undefined);
        }
      });
      await page.waitForTimeout(500);
    }
    await expect(completion).toBeVisible({ timeout: 5_000 });

    await gotoStable(page, `/${locale}/learn/${assessment.courseSlug}/${assessment.textLessonId}`);
    const complete = page.getByRole("button", {
      name: copy(locale, "أكملت الدرس", "Mark lesson complete"),
    });
    if ((await complete.count()) > 0) await complete.click();
    await expect(
      page.getByText(copy(locale, "أكملت هذا الدرس", "You completed this lesson")),
    ).toBeVisible();

    // First attempt deliberately fails (0 of 3) so the review and retry path is exercised.
    const quizPath = `/${locale}/learn/${assessment.courseSlug}/${assessment.quizLessonId}`;
    await gotoStable(page, quizPath);
    await page
      .getByRole("button", {
        name: new RegExp(copy(locale, "ابدأ الاختبار|أكمل المحاولة", "Start quiz|Resume")),
      })
      .click();
    await page.waitForURL(/\/quiz\?attempt=/, { timeout: 20_000 });
    const firstQuestion = page.locator("li").filter({ hasText: /٢ \+ ٢|2 \+ 2/ });
    await firstQuestion.getByLabel(copy(locale, "٥", "5")).check();
    await page.getByRole("textbox").fill(copy(locale, "خطأ", "wrong"));
    await page.getByRole("button", { name: copy(locale, "سلّم الاختبار", "Submit quiz") }).click();
    await expect(
      page.getByText(copy(locale, "لم تصل إلى درجة النجاح", "You did not reach the pass mark")),
    ).toBeVisible({ timeout: 20_000 });

    await gotoStable(page, quizPath);
    await page
      .getByRole("button", {
        name: new RegExp(copy(locale, "محاولة جديدة|ابدأ الاختبار", "Try again|Start quiz")),
      })
      .click();
    await page.waitForURL(/\/quiz\?attempt=/, { timeout: 20_000 });

    const answers =
      locale === "ar" ? assessment.answers : { single: "4", multi: ["2", "4"], short: "Midad" };
    const single = page.locator("li").filter({ hasText: /٢ \+ ٢|2 \+ 2/ });
    await single.getByLabel(answers.single).check();
    const multi = page.locator("li").filter({ hasText: /الأرقام الزوجية|even numbers/ });
    for (const answer of answers.multi) {
      await multi.getByLabel(answer).check();
    }
    await page.getByRole("textbox").fill(answers.short);
    await page.getByRole("button", { name: copy(locale, "سلّم الاختبار", "Submit quiz") }).click();
    await expect(
      page.getByText(copy(locale, "نجحت في الاختبار", "You passed the quiz")),
    ).toBeVisible({ timeout: 20_000 });

    await gotoStable(page, `/${locale}/dashboard`);
    const certificateLink = page.locator('a[href*="/verify/MD-"]').first();
    await expect(certificateLink).toBeVisible({ timeout: 20_000 });
    const href = await certificateLink.getAttribute("href");
    expect(href).not.toBeNull();

    const publicContext = await browser.newContext();
    const publicPage = await publicContext.newPage();
    await publicPage.goto(href ?? "", { waitUntil: "networkidle" });
    await expect(publicPage.getByText(assessment.name).first()).toBeVisible();
    await expect(
      publicPage.getByText(copy(locale, "شهادة صادرة من مِداد", "A certificate issued by Midad")),
    ).toBeVisible();
    const code = (href ?? "").split("/verify/")[1] ?? "";
    const pdf = await publicPage.request.get(`/api/certificates/${code}/pdf`);
    expect(pdf.status()).toBe(200);
    expect(pdf.headers()["content-type"]).toContain("application/pdf");
    expect((await pdf.body()).subarray(0, 5).toString()).toBe("%PDF-");
    await publicContext.close();
  });
}
