import { expect, test, type Page } from "@playwright/test";

/**
 * Wishlist (P03-T05, the product requirements).
 *
 * The required journey: a guest tries to save a course, is sent to sign in, and after signing in
 * lands back on the same course to complete the action. Then the wishlist page lists the course and
 * removing it really removes the row.
 */

const MAILPIT = process.env.MAILPIT_URL ?? "http://127.0.0.1:8025";
const PASSWORD = "Midad-Test-2026";
const COURSE = "/ar/courses/design-systems-in-figma";

let accountEmail = "";

type MailpitMessage = { ID: string; To: Array<{ Address: string }>; Subject: string };

async function verificationLink(address: string): Promise<string> {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const response = await fetch(`${MAILPIT}/api/v1/messages?limit=50`);
    const body = (await response.json()) as { messages: MailpitMessage[] };
    const message = body.messages.find(
      (item) =>
        item.Subject.includes("فعّل") &&
        item.To.some((to) => to.Address.toLowerCase() === address.toLowerCase()),
    );
    if (message !== undefined) {
      const detail = await fetch(`${MAILPIT}/api/v1/message/${message.ID}`);
      const content = (await detail.json()) as { Text?: string; HTML?: string };
      const text = content.Text ?? content.HTML ?? "";
      const link = text.match(/https?:\/\/[^\s"<>]+verify-email[^\s"<>]*/)?.[0];
      if (link !== undefined) return link;
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error(`No verification email for ${address} within 15s`);
}

async function registerVerified(page: Page): Promise<string> {
  const email = `wishlist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@midad.test`;
  await page.goto("/ar/register");
  await page.getByLabel("الاسم").fill("طالب المفضلة");
  await page.getByLabel("البريد الإلكتروني").fill(email);
  await page.getByLabel("كلمة المرور").fill(PASSWORD);
  await page.getByRole("button", { name: "إنشاء الحساب" }).click();
  await expect(page.getByText("أرسلنا رسالة إلى بريدك")).toBeVisible();
  await page.goto(await verificationLink(email));
  return email;
}

test.describe.configure({ mode: "serial" });

test.describe("wishlist", () => {
  test("anonymous visitors are sent to sign in and returned to the list", async ({ page }) => {
    await page.goto("/ar/wishlist");
    await expect(page).toHaveURL(/\/ar\/login\?next=%2Far%2Fwishlist/);
  });

  test("a guest saves a course after signing in and can remove it again", async ({ page }) => {
    accountEmail = await registerVerified(page);

    await page.goto(COURSE);
    await page.getByRole("link", { name: "أضف إلى المفضلة" }).click();
    await expect(page).toHaveURL(/\/ar\/login\?next=/);

    await page.getByLabel("البريد الإلكتروني").fill(accountEmail);
    await page.getByLabel("كلمة المرور").fill(PASSWORD);
    await page.getByRole("button", { name: "دخول" }).click();

    // Back on the same course, with the real toggle now available.
    await expect(page).toHaveURL(/\/ar\/courses\/design-systems-in-figma/);
    const save = page.getByRole("button", { name: "أضف إلى المفضلة" });
    await expect(save).toHaveAttribute("aria-pressed", "false");
    await save.click();
    await expect(page.getByRole("button", { name: "محفوظة في المفضلة" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await page.goto("/ar/wishlist");
    await expect(page.getByRole("heading", { level: 1, name: "المفضلة" })).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 3, name: /أنظمة التصميم في Figma/ }),
    ).toBeVisible();

    await page.getByRole("button", { name: "محفوظة في المفضلة" }).click();
    await expect(page.getByRole("heading", { name: "قائمتك فارغة" })).toBeVisible();
  });
});
