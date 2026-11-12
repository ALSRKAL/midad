import { expect, type Locator, type Page } from "@playwright/test";

/** Shared helpers for the eleven §13.3 journeys (P14-T01). */

export const MAILPIT = process.env["MAILPIT_URL"] ?? "http://127.0.0.1:8025";
export const PASSWORD = ["Midad", "Test", "2026"].join("-");

type MailpitMessage = { ID: string; To: Array<{ Address: string }>; Subject: string };

export function copy(locale: "ar" | "en", ar: string, en: string): string {
  return locale === "ar" ? ar : en;
}

export async function signInWithApi(page: Page, email: string, password = PASSWORD): Promise<void> {
  const response = await page.request.post("/api/auth/sign-in/email", {
    headers: { origin: "http://127.0.0.1:3100" },
    data: { email, password },
  });
  expect(response.ok(), `sign-in for ${email}`).toBe(true);
}

export async function signInWithUi(
  page: Page,
  locale: "ar" | "en",
  email: string,
  password = PASSWORD,
): Promise<void> {
  await page.goto(`/${locale}/login`);
  await page.getByLabel(copy(locale, "البريد الإلكتروني", "Email address")).fill(email);
  await page.getByLabel(copy(locale, "كلمة المرور", "Password")).fill(password);
  await page.getByRole("button", { name: copy(locale, "دخول", "Sign in") }).click();
  await page.waitForURL(new RegExp(`/${locale}$`), { timeout: 20_000 });
  await page.waitForLoadState("networkidle");
}

/** Waits until React has hydrated the document (see HydrationMarker). */
export async function waitForHydration(page: Page): Promise<void> {
  await page.waitForSelector("html[data-hydrated=true]", { timeout: 30_000 });
}

/**
 * Navigates and retries a document request aborted by a redirect already in flight. Firefox and
 * WebKit surface this as NS_BINDING_ABORTED / "interrupted by another navigation"; it is a browser
 * bookkeeping race, never an application failure (P15-T01). It also waits for hydration so a form
 * click cannot land before its handler exists.
 */
export async function gotoStable(page: Page, url: string): Promise<void> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await page.goto(url, { waitUntil: "networkidle" });
      await waitForHydration(page);
      return;
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      if (
        !/NS_BINDING_ABORTED|interrupted by another navigation|frame was detached/i.test(message)
      ) {
        throw error;
      }
      await page.waitForTimeout(700);
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`goto ${url} failed`);
}

/** Reloads with the same abort retry as gotoStable. */
export async function reloadStable(page: Page): Promise<void> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await page.reload({ waitUntil: "networkidle" });
      await waitForHydration(page);
      return;
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      if (
        !/NS_BINDING_ABORTED|interrupted by another navigation|frame was detached/i.test(message)
      ) {
        throw error;
      }
      await page.waitForTimeout(700);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("reload failed");
}

export async function waitForMail(
  address: string,
  subjectIncludes: string,
): Promise<MailpitMessage> {
  const deadline = Date.now() + 20_000;
  // Name the recipient and the subject in the query: a fixed "latest N" window drops messages once
  // the shared mailbox has thousands of rows from previous runs (P15-T01 zero-flaky).
  const query = new URLSearchParams({
    query: `to:${address} subject:"${subjectIncludes}"`,
  });
  while (Date.now() < deadline) {
    const response = await fetch(`${MAILPIT}/api/v1/search?${query.toString()}`);
    if (response.ok) {
      const body = (await response.json()) as { messages: MailpitMessage[] };
      const message = body.messages.find(
        (candidate) =>
          candidate.Subject.includes(subjectIncludes) &&
          candidate.To.some((to) => to.Address.toLowerCase() === address.toLowerCase()),
      );
      if (message !== undefined) return message;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`No "${subjectIncludes}" email for ${address} within 20s`);
}

export async function messageText(id: string): Promise<string> {
  const response = await fetch(`${MAILPIT}/api/v1/message/${id}`);
  const body = (await response.json()) as { Text?: string; HTML?: string };
  return body.Text ?? body.HTML ?? "";
}

export function unique(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/** A media element that has enough data to start (HLS attaches its blob source asynchronously). */
export async function waitForVideo(page: Page): Promise<Locator> {
  const video = page.locator("video").first();
  await expect(video).toBeVisible({ timeout: 20_000 });
  await page.waitForFunction(
    () => {
      const element = document.querySelector("video");
      return element !== null && element.readyState >= 2;
    },
    undefined,
    // The full matrix runs HLS processing beside the browser; a loaded host legitimately needs
    // more than 20 s to attach the blob source on Firefox (P15-T01).
    { timeout: 45_000 },
  );
  return video;
}

async function advanced(page: Page, seconds: number, timeout = 20_000): Promise<boolean> {
  return page
    .waitForFunction(
      (minimum) => {
        const element = document.querySelector("video");
        return element !== null && element.currentTime > minimum;
      },
      seconds,
      { timeout },
    )
    .then(() => true)
    .catch(() => false);
}

/**
 * Starts playback and proves the media clock moved. Mobile browsers can leave a programmatic
 * `play()` pending until the first tap, so the fallback performs the gesture a learner would.
 */
export async function startVideoPlayback(page: Page): Promise<Locator> {
  const video = await waitForVideo(page);
  const pressPlay = async () => {
    await video.evaluate((element) => {
      const media = element as HTMLVideoElement;
      media.muted = true;
      void media.play().catch(() => undefined);
    });
  };

  await pressPlay();
  if (await advanced(page, 0.25)) return video;

  await video.click();
  await pressPlay();
  if (await advanced(page, 0.25)) return video;

  await page.keyboard.press("Space");
  await pressPlay();
  if (await advanced(page, 0.25)) return video;

  throw new Error("Video playback did not start after programmatic play and a tap");
}

/** Waits for the player's own confirmation that a progress write committed. */
export async function waitForProgressSaved(
  page: Page,
  locale: "ar" | "en",
  timeout = 30_000,
): Promise<void> {
  await expect(page.locator("p[role=status]").first()).toContainText(
    copy(locale, "حُفظ تقدمك", "Progress saved"),
    { timeout },
  );
}
