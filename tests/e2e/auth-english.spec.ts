import { expect, test, type Page } from "@playwright/test";

/**
 * The full authentication journey through the English interface (P02-T07).
 *
 * The Arabic journeys live in auth.spec.ts and password-reset.spec.ts; this file proves the same
 * paths are translated, not only the shell: labels, validation, emails, reset and signed-in state.
 */

const MAILPIT = process.env.MAILPIT_URL ?? "http://127.0.0.1:8025";
const INITIAL_PASSWORD = "Midad-English-Init1";
const NEW_PASSWORD = "Midad-English-New2";

type MailpitMessage = { ID: string; To: Array<{ Address: string }>; Subject: string };

let accountEmail = "";

async function findMessage(address: string, subjectIncludes: string): Promise<string> {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const response = await fetch(`${MAILPIT}/api/v1/messages?limit=50`);
    const body = (await response.json()) as { messages: MailpitMessage[] };
    const message = body.messages.find(
      (item) =>
        item.Subject.includes(subjectIncludes) &&
        item.To.some((to) => to.Address.toLowerCase() === address.toLowerCase()),
    );
    if (message !== undefined) {
      const detail = await fetch(`${MAILPIT}/api/v1/message/${message.ID}`);
      const content = (await detail.json()) as { Text?: string; HTML?: string };
      return content.Text ?? content.HTML ?? "";
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error(`No "${subjectIncludes}" email for ${address} within 15s`);
}

async function signIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/en/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/en$/);
  await page.waitForLoadState("networkidle");
}

test.describe.configure({ mode: "serial" });

test.describe("authentication in English", () => {
  test("registers, verifies and signs in with English copy", async ({ page }) => {
    accountEmail = `english-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@midad.test`;

    await page.goto("/en/register");
    await expect(page.getByRole("heading", { level: 1, name: "Create an account" })).toBeVisible();
    await page.getByLabel("Name").fill("English Journey");
    await page.getByLabel("Email address").fill(accountEmail);
    await page.getByLabel("Password").fill(INITIAL_PASSWORD);
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByText("We sent you an email.")).toBeVisible();

    const mail = await findMessage(accountEmail, "Verify");
    const verifyLink = mail.match(/https?:\/\/[^\s"<>]+verify-email[^\s"<>]*/)?.[0];
    expect(verifyLink, `verification link missing from:\n${mail}`).toBeDefined();
    await page.goto(verifyLink ?? "");

    await signIn(page, accountEmail, INITIAL_PASSWORD);
    await expect(page.getByRole("link", { name: "Sign in" })).toHaveCount(0);
    // The interface is still English after signing in, not redirected to Arabic.
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  });

  test("reports validation and wrong-password errors in English", async ({ page }) => {
    await page.goto("/en/register");
    await page.getByLabel("Name").fill("Short Password");
    await page.getByLabel("Email address").fill(`short-${Date.now()}@midad.test`);
    await page.getByLabel("Password").fill("short");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.locator('p[role="alert"]')).toContainText("At least 8 characters.");

    await page.goto("/en/login");
    await page.getByLabel("Email address").fill(accountEmail);
    await page.getByLabel("Password").fill("Midad-Wrong-Password-1");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.locator('p[role="alert"]')).toContainText("Email or password is incorrect.");
  });

  test("requests and completes a password reset in English", async ({ page }) => {
    await page.goto("/en/forgot-password");
    await expect(
      page.getByRole("heading", { level: 1, name: "Forgot your password" }),
    ).toBeVisible();
    await page.getByLabel("Email address").fill(accountEmail);
    await page.getByRole("button", { name: "Send the link" }).click();
    await expect(page.getByText("Check your inbox")).toBeVisible();

    const mail = await findMessage(accountEmail, "Reset your password");
    const resetLink = mail.match(/https?:\/\/[^\s"<>]+reset-password[^\s"<>]*/)?.[0];
    expect(resetLink, `reset link missing from:\n${mail}`).toBeDefined();

    const response = await page.request.get(resetLink ?? "", { maxRedirects: 0 });
    const location = response.headers()["location"] ?? "";
    expect(location).toContain("token=");
    await page.goto(location);

    await expect(page.getByRole("heading", { level: 1, name: "Set a new password" })).toBeVisible();
    await page.getByLabel("New password").fill(NEW_PASSWORD);
    await page.getByLabel("Confirm password").fill(NEW_PASSWORD);
    await page.getByRole("button", { name: "Save password" }).click();
    await expect(page.getByText("Your password has been changed.")).toBeVisible();

    await signIn(page, accountEmail, NEW_PASSWORD);
    await expect(page.getByRole("link", { name: "Sign in" })).toHaveCount(0);
  });
});
