import { expect, test } from "@playwright/test";

import { fixture, type FixtureUser } from "../e2e/helpers/fixtures";
import { copy } from "./helpers";

/**
 * Journey 10 (§13.3): every protected route rejects the wrong role, a paid lesson URL leaks no
 * content to a guest, an unsigned media URL is refused and a signed URL expires.
 */

type Learner = FixtureUser & { courseSlug: string; videoLessonId: string | null };

for (const locale of ["ar", "en"] as const) {
  test(`authorization and signed media in ${locale}`, async ({ page, browser }) => {
    const learner = await fixture<Learner>("/learner", {
      courseSlug: "modern-react-app-development",
    });
    const asset = await fixture<{ originalKey: string; hlsKey: string | null }>("/asset");
    const lessonPath = `/${locale}/learn/${learner.courseSlug}/${learner.videoLessonId ?? ""}`;

    const guestContext = await browser.newContext();
    const guest = await guestContext.newPage();
    await guest.goto(lessonPath, { waitUntil: "networkidle" });
    await expect(guest).toHaveURL(new RegExp(`/${locale}/login\\?next=`), { timeout: 20_000 });
    await guestContext.close();

    const signIn = await page.request.post("/api/auth/sign-in/email", {
      headers: { origin: "http://127.0.0.1:3100" },
      data: { email: learner.email, password: learner.password },
    });
    expect(signIn.ok()).toBe(true);

    await page.goto(`/${locale}/admin`, { waitUntil: "networkidle" });
    await expect(
      page.getByRole("heading", {
        name: copy(locale, "لا تملك صلاحية الوصول", "You do not have access"),
      }),
    ).toBeVisible();
    await page.goto(`/${locale}/instructor`, { waitUntil: "networkidle" });
    await expect(
      page.getByRole("heading", {
        name: copy(locale, "لا تملك صلاحية الوصول", "You do not have access"),
      }),
    ).toBeVisible();

    // The route must never serve a manifest to an unauthorised context. The seed lesson in this
    // course may also legitimately answer 409 VIDEO_NOT_READY; both are refusals without content.
    const unsignedManifest = await page.request.get(
      `/api/player/hls/${learner.videoLessonId ?? ""}`,
    );
    expect(unsignedManifest.status()).toBeGreaterThanOrEqual(400);

    await page.goto(lessonPath, { waitUntil: "networkidle" });
    const video = page.locator("video").first();
    await expect(video).toBeVisible({ timeout: 20_000 });
    const src = await video.evaluate((element) => {
      const media = element as HTMLVideoElement;
      return media.currentSrc === "" ? media.src : media.currentSrc;
    });
    if (!src.startsWith("blob:")) {
      const unsigned = await page.request.get(src.split("?")[0] ?? "");
      expect([401, 403]).toContain(unsigned.status());
    }

    const expired = await fixture<{ url: string }>("/expired-url", {
      key: asset.hlsKey ?? asset.originalKey,
    });
    await page.waitForTimeout(2_500);
    const expiredResponse = await page.request.get(expired.url);
    expect([401, 403]).toContain(expiredResponse.status());
  });
}
