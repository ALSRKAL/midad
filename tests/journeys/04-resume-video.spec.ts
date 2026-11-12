import { expect, test } from "@playwright/test";

import { fixture, type FixtureUser } from "../e2e/helpers/fixtures";
import { copy, startVideoPlayback, waitForProgressSaved } from "./helpers";

/**
 * Journey 4 (§13.3): the learner closes the tab mid-video, returns, resumes near the same second,
 * adds a timestamped private note and clicks it to seek the player.
 *
 * Every wait is on the player's real state (media clock or saved-progress acknowledgement), never
 * on an assumed duration: the tab is closed only after the pause flush confirms it committed.
 */

type Learner = FixtureUser & {
  courseSlug: string;
  videoLessonId: string | null;
};

for (const locale of ["ar", "en"] as const) {
  test(`resume the video and seek from a note in ${locale}`, async ({ page }) => {
    // WebKit media + a loaded host can take well over the default three minutes for two page
    // loads, playback, persisted resume and note seeking.
    test.setTimeout(300_000);
    const learner = await fixture<Learner>("/learner", {
      courseSlug: "modern-react-app-development",
      // Ten seconds leaves room to pause before the clip ends; an eight-second clip can end
      // between the media-clock check and the pause, saving position == duration (P15-T01).
      minVideoDurationSec: 10,
    });
    expect(learner.videoLessonId, "video lesson").not.toBeNull();
    const signIn = await page.request.post("/api/auth/sign-in/email", {
      headers: { origin: "http://127.0.0.1:3100" },
      data: { email: learner.email, password: learner.password },
    });
    expect(signIn.ok()).toBe(true);

    const lessonPath = `/${locale}/learn/${learner.courseSlug}/${learner.videoLessonId ?? ""}`;
    await page.goto(lessonPath, { waitUntil: "networkidle" });
    const video = await startVideoPlayback(page);
    // Watch real media seconds; the fixture selects a clip of at least ten seconds.
    await page.waitForFunction(
      () => {
        const element = document.querySelector("video");
        return element !== null && (element.currentTime >= 6 || element.ended);
      },
      undefined,
      { timeout: 30_000 },
    );
    // Pause before reading: two round trips of playing time would make "watched" stale, and the
    // flush would save a later position than the one this test compares against.
    await video.evaluate((element) => {
      (element as HTMLVideoElement).pause();
    });
    let watched = await video.evaluate((element) => (element as HTMLVideoElement).currentTime);
    const duration = await video.evaluate((element) => (element as HTMLVideoElement).duration);
    if (watched >= duration - 0.5) {
      // The clip reached its end before the pause landed (slow host). Re-enter the clip so the
      // saved position is inside it and the resume assertion remains meaningful.
      await video.evaluate((element) => {
        const media = element as HTMLVideoElement;
        media.currentTime = Math.max(1, media.duration - 2);
        media.muted = true;
        void media.play().catch(() => undefined);
      });
      await page.waitForFunction(
        () => {
          const element = document.querySelector("video");
          return element !== null && element.currentTime >= element.duration - 1.5;
        },
        undefined,
        { timeout: 20_000 },
      );
      await video.evaluate((element) => {
        (element as HTMLVideoElement).pause();
      });
      watched = await video.evaluate((element) => (element as HTMLVideoElement).currentTime);
    }
    expect(watched).toBeGreaterThan(5);
    // Pause flushes the watched segment through the player action. Closing the tab before that
    // action commits was the race that lost the position on mobile (P15-T01).
    await waitForProgressSaved(page, locale);

    // Close the tab entirely; the session and saved position survive in the database.
    const context = page.context();
    await page.close();
    const resumed = await context.newPage();
    await resumed.goto(lessonPath, { waitUntil: "networkidle" });
    const resumedVideo = resumed.locator("video").first();
    await expect(resumedVideo).toBeVisible({ timeout: 20_000 });
    // The server rendered the saved row: the player itself announces the resume position.
    await expect(resumed.locator("p[role=status]").first()).toContainText(
      copy(locale, "استئناف من", "Resume from"),
      { timeout: 20_000 },
    );
    await resumed.waitForFunction(
      (expected) => {
        const element = document.querySelector("video");
        return element !== null && element.currentTime >= expected;
      },
      Math.max(1.5, watched - 1.5),
      { timeout: 20_000 },
    );
    const resumedAt = await resumedVideo.evaluate(
      (element) => (element as HTMLVideoElement).currentTime,
    );
    expect(
      Math.abs(resumedAt - Math.floor(watched)),
      `watched=${watched} resumedAt=${resumedAt}`,
    ).toBeLessThanOrEqual(1);

    // Move earlier so the note's seek target cannot be confused with the resume point.
    await resumedVideo.evaluate((element) => {
      (element as HTMLVideoElement).currentTime = 1;
    });
    await resumedVideo.evaluate((element) => {
      const media = element as HTMLVideoElement;
      media.muted = true;
      void media.play().catch(() => undefined);
    });
    await resumed.waitForFunction(
      () => {
        const element = document.querySelector("video");
        return element !== null && element.currentTime >= 2;
      },
      undefined,
      { timeout: 20_000 },
    );
    await resumedVideo.evaluate((element) => {
      (element as HTMLVideoElement).pause();
    });
    await waitForProgressSaved(resumed, locale);

    await resumed.getByRole("tab", { name: copy(locale, "ملاحظاتي", "My notes") }).click();
    await resumed
      .locator("#note-body")
      .fill(copy(locale, "ملاحظة عند توقيت محدد", "A note at this timestamp"));
    await resumed.getByRole("button", { name: /أضف|Add/ }).click();
    await expect(
      resumed.getByText(copy(locale, "ملاحظة عند توقيت محدد", "A note at this timestamp")),
    ).toBeVisible();

    // Reset to the start, then prove the note button actually seeks the player.
    await resumedVideo.evaluate((element) => {
      (element as HTMLVideoElement).currentTime = 0;
    });
    await resumed.waitForFunction(() => {
      const element = document.querySelector("video");
      return element !== null && element.currentTime < 0.5;
    });
    const seekButton = resumed.getByRole("button", {
      name: new RegExp(copy(locale, "استئناف من", "Resume from")),
    });
    await expect(seekButton.first()).toBeVisible();
    await seekButton.first().click();
    await resumed.waitForFunction(
      () => {
        const element = document.querySelector("video");
        return element !== null && element.currentTime > 1.5;
      },
      undefined,
      { timeout: 10_000 },
    );
  });
}
