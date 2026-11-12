import { expect, test, type Page } from "@playwright/test";

/**
 * Instructor application journey (P02-T06, the product requirements).
 *
 * Covers the three states a learner can meet — no application, pending, and already an instructor —
 * in both languages, plus the validation rules and the persistence of a submitted application.
 * A disposable verified account is used for the write path so reruns never collide with the seeded
 * pending applicant.
 */

const MAILPIT = process.env.MAILPIT_URL ?? "http://127.0.0.1:8025";
// Same documented test-only password as the seeded accounts; the address is unique per run.
const PASSWORD = "Midad-Test-2026";
const SEED_PASSWORD = "Midad-Test-2026";
// The seeded applicant has a PENDING row created by prisma/seed/seed.ts.
const PENDING_EMAIL = "applicant@midad.test";

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

async function registerVerified(page: Page, prefix: string): Promise<string> {
  const email = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@midad.test`;
  await page.goto("/ar/register");
  await page.getByLabel("الاسم").fill("متقدم اختبار");
  await page.getByLabel("البريد الإلكتروني").fill(email);
  await page.getByLabel("كلمة المرور").fill(PASSWORD);
  await page.getByRole("button", { name: "إنشاء الحساب" }).click();
  await expect(page.getByText("أرسلنا رسالة إلى بريدك")).toBeVisible();
  await page.goto(await verificationLink(email));
  return email;
}

async function signIn(page: Page, email: string, password = PASSWORD): Promise<void> {
  await page.goto("/ar/login");
  await page.getByLabel("البريد الإلكتروني").fill(email);
  await page.getByLabel("كلمة المرور").fill(password);
  await page.getByRole("button", { name: "دخول" }).click();
  await page.waitForURL(/\/ar$/);
  await page.waitForLoadState("networkidle");
}

test.describe.configure({ mode: "serial" });

test.describe("instructor application", () => {
  test("anonymous visitors are sent to sign in and brought back", async ({ page }) => {
    await page.goto("/ar/teach");
    await expect(page).toHaveURL(/\/ar\/login\?next=%2Far%2Fteach/);
    await expect(page.getByRole("heading", { level: 1, name: "تسجيل الدخول" })).toBeVisible();
  });

  test("an instructor sees the already-instructor state, not the form", async ({ page }) => {
    await signIn(page, "instructor.demo@midad.test", SEED_PASSWORD);
    await page.goto("/ar/teach");

    await expect(page.getByRole("heading", { name: "أنت مدرب بالفعل" })).toBeVisible();
    await expect(page.getByRole("link", { name: "الذهاب إلى لوحة المدرب" })).toHaveAttribute(
      "href",
      "/ar/instructor",
    );
    await expect(page.getByLabel("الخبرة")).toHaveCount(0);
  });

  test("the seeded pending applicant sees the status, the details and no form", async ({
    page,
  }) => {
    await signIn(page, PENDING_EMAIL, SEED_PASSWORD);
    await page.goto("/ar/teach");

    await expect(page.getByRole("heading", { name: "طلبك قيد المراجعة" })).toBeVisible();
    await expect(page.getByText("إدارة المعرفة وخدمة العملاء").first()).toBeVisible();
    await expect(
      page.getByRole("link", { name: "https://afnan-albaqami.example/portfolio" }),
    ).toBeVisible();
    await expect(page.getByLabel("الخبرة")).toHaveCount(0);

    await page.goto("/en/teach");
    await expect(
      page.getByRole("heading", { name: "Your application is under review" }),
    ).toBeVisible();
    await expect(page.getByText("Under review").first()).toBeVisible();
  });

  test("a new learner is validated, submits, and the application persists", async ({ page }) => {
    const email = await registerVerified(page, "apply");
    await signIn(page, email);
    await page.goto("/ar/teach");

    await expect(page.getByRole("heading", { name: "طلب التحول إلى مدرب" })).toBeVisible();

    // Too short: the client refuses before a request is sent.
    await page.getByLabel("المجال").fill("التصميم");
    await page.getByLabel("الخبرة").fill("قصيرة");
    await page.getByRole("button", { name: "إرسال الطلب" }).click();
    await expect(page.locator('p[role="alert"]')).toContainText("50 حرفًا");

    // A javascript: URL must never be stored and later rendered to an admin.
    await page
      .getByLabel("الخبرة")
      .fill(
        "ثماني سنوات في تصميم منتجات رقمية، قمت خلالها ببناء أنظمة تصميم وإدارة فرق تصميم من أربعة أشخاص.",
      );
    await page.getByLabel("رابط ملف الأعمال (اختياري)").fill("javascript:alert(1)");
    await page.getByRole("button", { name: "إرسال الطلب" }).click();
    await expect(page.locator('p[role="alert"]')).toContainText("http");

    await page.getByLabel("رابط ملف الأعمال (اختياري)").fill("https://example.com/portfolio");
    await page
      .getByLabel("رابط عينة فيديو (اختياري)")
      .fill("https://example.com/sample-lesson.mp4");
    await page.getByRole("button", { name: "إرسال الطلب" }).click();

    await expect(page.getByRole("heading", { name: "طلبك قيد المراجعة" })).toBeVisible();
    await expect(page.getByText("التصميم").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "سجل الطلبات" })).toBeVisible();

    // Persisted server-side: a reload still shows the pending state and no form.
    await page.reload();
    await expect(page.getByRole("heading", { name: "طلبك قيد المراجعة" })).toBeVisible();
    await expect(page.getByLabel("الخبرة")).toHaveCount(0);
  });
});
