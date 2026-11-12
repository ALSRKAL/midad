import { expect, test, type Page } from "@playwright/test";

/**
 * Password reset journey (P02-T02).
 *
 * Proves the whole path: request → email in Mailpit → link with token → set a new password → sign in
 * with it. Also proves the two properties the prompt requires: the token is single-use, and a
 * malformed token is rejected without revealing anything.
 */

const MAILPIT = process.env.MAILPIT_URL ?? "http://127.0.0.1:8025";

type MailpitMessage = { ID: string; To: Array<{ Address: string }>; Subject: string };

async function findMessage(
  address: string,
  subjectIncludes: string,
): Promise<MailpitMessage | undefined> {
  const response = await fetch(`${MAILPIT}/api/v1/messages?limit=50`);
  const body = (await response.json()) as { messages: MailpitMessage[] };
  // A single address can receive several messages (verification, then reset); match the subject so
  // a test never reads the wrong link.
  return body.messages.find(
    (message) =>
      message.Subject.includes(subjectIncludes) &&
      message.To.some((to) => to.Address.toLowerCase() === address.toLowerCase()),
  );
}

async function waitForMessage(address: string, subjectIncludes: string): Promise<MailpitMessage> {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const message = await findMessage(address, subjectIncludes);
    if (message !== undefined) return message;
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error(`No email for ${address} within 15s`);
}

async function messageText(id: string): Promise<string> {
  const response = await fetch(`${MAILPIT}/api/v1/message/${id}`);
  const body = (await response.json()) as { Text?: string; HTML?: string };
  return body.Text ?? body.HTML ?? "";
}

/**
 * The emailed link points at Better Auth's endpoint, which validates the token and redirects to the
 * page with `?token=`. Following the redirect explicitly lets the test fail with the API's actual
 * answer (e.g. `error=INVALID_TOKEN`) instead of a vague "field not found" timeout.
 */
async function openResetLink(page: Page, link: string): Promise<void> {
  const response = await page.request.get(link, { maxRedirects: 0 });
  const location = response.headers()["location"] ?? "";
  expect(location, `reset redirect was: ${response.status()} ${location}`).toContain("token=");
  await page.goto(location);
}

async function signIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/ar/login");
  await page.getByLabel("البريد الإلكتروني").fill(email);
  await page.getByLabel("كلمة المرور").fill(password);
  await page.getByRole("button", { name: "دخول" }).click();
}

test.describe.configure({ mode: "serial" });

test.describe("password reset", () => {
  test("requests a link, sets a new password and signs in with it", async ({ page }) => {
    const email = `reset-${Date.now()}@midad.test`;
    const original = "Midad-Reset-Start1";

    // Create the account through the real sign-up endpoint, then verify it through the API so this
    // test can focus on the reset flow rather than repeating the verification journey.
    await page.goto("/ar/register");
    await page.getByLabel("الاسم").fill("اختبار الاستعادة");
    await page.getByLabel("البريد الإلكتروني").fill(email);
    await page.getByLabel("كلمة المرور").fill(original);
    await page.getByRole("button", { name: "إنشاء الحساب" }).click();
    await expect(page.getByText("أرسلنا رسالة إلى بريدك")).toBeVisible();

    const verification = await waitForMessage(email, "فعّل");
    const verificationText = await messageText(verification.ID);
    const verifyLink = verificationText.match(/https?:\/\/[^\s"<>]+verify-email[^\s"<>]*/)?.[0];
    expect(verifyLink).toBeDefined();
    await page.goto(verifyLink ?? "");

    await page.goto("/ar/forgot-password");
    await page.getByLabel("البريد الإلكتروني").fill(email);
    await page.getByRole("button", { name: "أرسل الرابط" }).click();
    await expect(page.getByText("تحقّق من بريدك")).toBeVisible();

    const resetMessage = await waitForMessage(email, "إعادة تعيين");
    const resetText = await messageText(resetMessage.ID);
    const resetLink = resetText.match(/https?:\/\/[^\s"<>]+reset-password[^\s"<>]*/)?.[0];
    expect(resetLink, `reset link missing from:\n${resetText}`).toBeDefined();

    await openResetLink(page, resetLink ?? "");
    await page.getByLabel("كلمة المرور الجديدة").fill("Midad-Reset-New2");
    await page.getByLabel("تأكيد كلمة المرور").fill("Midad-Reset-New2");
    await page.getByRole("button", { name: "حفظ كلمة المرور" }).click();

    await expect(page.getByText("تم تغيير كلمة المرور")).toBeVisible();

    await signIn(page, email, "Midad-Reset-New2");
    await page.waitForURL(/\/ar$/);
    // Signed in means the sign-in link is gone, which holds on desktop and inside the mobile drawer.
    await expect(page.getByRole("link", { name: "تسجيل الدخول" })).toHaveCount(0);
  });

  test("does not accept the same token twice", async ({ page }) => {
    const email = `reset-once-${Date.now()}@midad.test`;
    const original = "Midad-Reset-Once1";

    await page.goto("/ar/register");
    await page.getByLabel("الاسم").fill("مرة واحدة");
    await page.getByLabel("البريد الإلكتروني").fill(email);
    await page.getByLabel("كلمة المرور").fill(original);
    await page.getByRole("button", { name: "إنشاء الحساب" }).click();
    await expect(page.getByText("أرسلنا رسالة إلى بريدك")).toBeVisible();

    const verification = await waitForMessage(email, "فعّل");
    const verifyLink = (await messageText(verification.ID)).match(
      /https?:\/\/[^\s"<>]+verify-email[^\s"<>]*/,
    )?.[0];
    await page.goto(verifyLink ?? "");

    await page.goto("/ar/forgot-password");
    await page.getByLabel("البريد الإلكتروني").fill(email);
    await page.getByRole("button", { name: "أرسل الرابط" }).click();

    const resetMessage = await waitForMessage(email, "إعادة تعيين");
    const resetLink = (await messageText(resetMessage.ID)).match(
      /https?:\/\/[^\s"<>]+reset-password[^\s"<>]*/,
    )?.[0];
    expect(resetLink).toBeDefined();

    await openResetLink(page, resetLink ?? "");
    await page.getByLabel("كلمة المرور الجديدة").fill("Midad-Reset-Used3");
    await page.getByLabel("تأكيد كلمة المرور").fill("Midad-Reset-Used3");
    await page.getByRole("button", { name: "حفظ كلمة المرور" }).click();
    await expect(page.getByText("تم تغيير كلمة المرور")).toBeVisible();

    // Reusing the same link must fail: the endpoint now answers INVALID_TOKEN instead of a token.
    const reuse = await page.request.get(resetLink ?? "", { maxRedirects: 0 });
    const reuseLocation = reuse.headers()["location"] ?? "";
    expect(reuseLocation).toContain("error=INVALID_TOKEN");
  });

  test("rejects a tampered token and offers a new request", async ({ page }) => {
    await page.goto("/ar/reset-password?token=not-a-real-token");
    await page.getByLabel("كلمة المرور الجديدة").fill("Midad-Reset-Bogus1");
    await page.getByLabel("تأكيد كلمة المرور").fill("Midad-Reset-Bogus1");
    await page.getByRole("button", { name: "حفظ كلمة المرور" }).click();
    await expect(page.locator('p[role="alert"]')).toContainText("غير صالح");
  });

  test("reports the same confirmation for an unknown address", async ({ page }) => {
    await page.goto("/ar/forgot-password");
    await page.getByLabel("البريد الإلكتروني").fill("never-registered@midad.test");
    await page.getByRole("button", { name: "أرسل الرابط" }).click();
    await expect(page.getByText("تحقّق من بريدك")).toBeVisible();
  });
});
