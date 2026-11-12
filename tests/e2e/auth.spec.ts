import { expect, test, type Page } from "@playwright/test";

/**
 * Authentication journey (P02-T01, the product requirements journey 1's auth half).
 *
 * Uses a unique address per run so the suite can be repeated against the same database. Email is
 * read from Mailpit's HTTP API — the same inbox a developer inspects — so this proves the message
 * really leaves the app rather than that a function was called.
 */

const MAILPIT = process.env.MAILPIT_URL ?? "http://127.0.0.1:8025";

type MailpitMessage = { ID: string; To: Array<{ Address: string }>; Subject: string };

async function latestMessageFor(
  address: string,
  subjectIncludes = "فعّل",
): Promise<MailpitMessage | undefined> {
  const response = await fetch(`${MAILPIT}/api/v1/messages?limit=50`);
  if (!response.ok) throw new Error(`Mailpit responded ${response.status}`);
  const body = (await response.json()) as { messages: MailpitMessage[] };
  return body.messages.find(
    (message) =>
      message.Subject.includes(subjectIncludes) &&
      message.To.some((to) => to.Address.toLowerCase() === address.toLowerCase()),
  );
}

async function messageText(id: string): Promise<string> {
  const response = await fetch(`${MAILPIT}/api/v1/message/${id}`);
  const body = (await response.json()) as { Text?: string; HTML?: string };
  return body.Text ?? body.HTML ?? "";
}

async function waitForMessage(address: string): Promise<MailpitMessage> {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const message = await latestMessageFor(address);
    if (message !== undefined) return message;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`No email arrived for ${address} within 15s`);
}

/**
 * Serial on purpose: every test here drives the same SMTP transport and the same users table, and
 * running them in parallel made failures depend on scheduling rather than on the product.
 */

/**
 * On a phone the account area lives inside the drawer. Opening it right after a client-side
 * navigation can race with the router refresh, so wait for the page to settle first and then
 * assert against the dialog explicitly.
 */
async function openAccountDrawer(page: Page): Promise<boolean> {
  const menuButton = page.getByRole("button", { name: "افتح القائمة" });
  // After a client-side navigation the header may still be re-rendering; give it a moment before
  // concluding that this is a desktop viewport (where the button does not exist at all).
  try {
    await menuButton.waitFor({ state: "visible", timeout: 5_000 });
  } catch {
    return false;
  }
  await page.waitForLoadState("networkidle");
  await menuButton.click();
  await page.getByRole("dialog").waitFor({ state: "visible" });
  return true;
}

test.describe.configure({ mode: "serial" });

test.describe("registration and sign-in", () => {
  test("registers, verifies by email, signs in and signs out", async ({ page }) => {
    const unique = `e2e-${Date.now()}`;
    const email = `${unique}@midad.test`;
    const password = "Midad-E2E-2026";

    await page.goto("/ar/register");
    await page.getByLabel("الاسم").fill("مستخدم الاختبار");
    await page.getByLabel("البريد الإلكتروني").fill(email);
    await page.getByLabel("كلمة المرور").fill(password);
    await page.getByRole("button", { name: "إنشاء الحساب" }).click();

    await expect(page.getByText("أرسلنا رسالة إلى بريدك")).toBeVisible();

    const message = await waitForMessage(email);
    expect(message.Subject).toContain("فعّل بريدك");

    const body = await messageText(message.ID);
    const link = body.match(/https?:\/\/[^\s"<>]+verify-email[^\s"<>]*/)?.[0];
    expect(link, `verification link missing from:\n${body}`).toBeDefined();

    await page.goto(link ?? "");
    // Better Auth's verification endpoint redirects back to the callback URL we configured.
    await expect(page).toHaveURL(/\/login\?verified=1/);
    await expect(page.getByText("تم تفعيل بريدك")).toBeVisible();

    await page.getByLabel("البريد الإلكتروني").fill(email);
    await page.getByLabel("كلمة المرور").fill(password);
    await page.getByRole("button", { name: "دخول" }).click();

    await page.waitForURL(/\/ar$/);
    await page.waitForLoadState("networkidle");
    const drawerOpen = await openAccountDrawer(page);
    const scope = drawerOpen ? page.getByRole("dialog") : page;
    await expect(scope.getByText("مستخدم الاختبار")).toBeVisible();

    await scope.getByRole("button", { name: "خروج" }).click();

    const drawerAfter = await openAccountDrawer(page);
    const scopeAfter = drawerAfter ? page.getByRole("dialog") : page;
    await expect(scopeAfter.getByRole("link", { name: "تسجيل الدخول" })).toBeVisible();
  });

  test("refuses an unverified account with an actionable message", async ({ page }) => {
    const email = `e2e-unverified-${Date.now()}@midad.test`;
    const password = "Midad-E2E-2026";

    await page.goto("/ar/register");
    await page.getByLabel("الاسم").fill("غير مفعّل");
    await page.getByLabel("البريد الإلكتروني").fill(email);
    await page.getByLabel("كلمة المرور").fill(password);
    await page.getByRole("button", { name: "إنشاء الحساب" }).click();
    await expect(page.getByText("أرسلنا رسالة إلى بريدك")).toBeVisible();

    await page.goto("/ar/login");
    await page.getByLabel("البريد الإلكتروني").fill(email);
    await page.getByLabel("كلمة المرور").fill(password);
    await page.getByRole("button", { name: "دخول" }).click();

    await expect(page.locator('p[role="alert"]')).toContainText("غير مفعّل");
  });

  test("rejects a wrong password without revealing whether the account exists", async ({
    page,
  }) => {
    await page.goto("/ar/login");
    await page.getByLabel("البريد الإلكتروني").fill("student.demo@midad.test");
    await page.getByLabel("كلمة المرور").fill("definitely-wrong");
    await page.getByRole("button", { name: "دخول" }).click();

    await expect(page.locator('p[role="alert"]')).toContainText("البريد أو كلمة المرور غير صحيحة");

    // The same message must appear for an address that does not exist.
    await page.goto("/ar/login");
    await page.getByLabel("البريد الإلكتروني").fill("nobody-here@midad.test");
    await page.getByLabel("كلمة المرور").fill("another-wrong-password");
    await page.getByRole("button", { name: "دخول" }).click();
    await expect(page.locator('p[role="alert"]')).toContainText("البريد أو كلمة المرور غير صحيحة");
  });

  test("signs in a seeded account whose password was hashed by the seeder", async ({ page }) => {
    await page.goto("/ar/login");
    await page.getByLabel("البريد الإلكتروني").fill("student.demo@midad.test");
    await page.getByLabel("كلمة المرور").fill("Midad-Test-2026");
    await page.getByRole("button", { name: "دخول" }).click();

    await page.waitForURL(/\/ar$/);
    await page.waitForLoadState("networkidle");
    const drawerOpen = await openAccountDrawer(page);
    if (drawerOpen) {
      await expect(page.getByRole("dialog").getByText("ريم الدوسري")).toBeVisible();
    } else {
      // Target the header identity, not a homepage review/testimonial carrying the same name.
      await expect(page.getByTitle("مسجّل الدخول باسم")).toHaveText("ريم الدوسري");
    }
  });
});

test("Google sign-in is hidden when no Google keys are configured", async ({ page }) => {
  // This environment has no GOOGLE_CLIENT_ID/SECRET, so the button must not be rendered at all:
  // a visible OAuth button that fails would violate the product requirements.
  await page.goto("/ar/login");
  await expect(page.getByRole("button", { name: "المتابعة بحساب Google" })).toHaveCount(0);

  await page.goto("/en/register");
  await expect(page.getByRole("button", { name: "Continue with Google" })).toHaveCount(0);
});
