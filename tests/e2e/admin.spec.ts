import { readFileSync } from "node:fs";

import { expect, test, type Page } from "@playwright/test";

import { fixture, type FixtureUser } from "./helpers/fixtures";

/**
 * Admin core (P05-T01…T04).
 *
 * Every project creates its own pending courses, applications and target user through the fixture
 * API, so the admin queues can be exercised on every browser without approving another project's
 * row (P14-T01). Projects run serially because platform settings are global.
 */

const PASSWORD = readFileSync("/tmp/midad-e2e-password.txt", "utf8").trim();
const ADMIN = "admin@midad.test";

type PendingCourse = {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string;
  instructorEmail: string;
};

let approveCourse: PendingCourse;
let rejectCourse: PendingCourse;
let approveApplicant: FixtureUser;
let rejectApplicant: FixtureUser;
let targetUser: FixtureUser;

test.beforeAll(async () => {
  const suffix = Date.now().toString(36);
  approveCourse = await fixture<PendingCourse>("/pending-course", {
    titleAr: `دورة مراجعة للموافقة ${suffix}`,
    titleEn: `Review course to approve ${suffix}`,
  });
  rejectCourse = await fixture<PendingCourse>("/pending-course", {
    titleAr: `دورة مراجعة للرفض ${suffix}`,
    titleEn: `Review course to reject ${suffix}`,
  });
  approveApplicant = await fixture<FixtureUser>("/application", { field: "تصميم المنتجات" });
  rejectApplicant = await fixture<FixtureUser>("/application", { field: "التسويق الرقمي" });
  targetUser = await fixture<FixtureUser>("/user", {
    name: `مستخدم الإدارة ${suffix}`,
    role: "STUDENT",
  });
});

async function signInAs(page: Page, email: string): Promise<void> {
  await page.context().clearCookies();
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await page.request.post("/api/auth/sign-in/email", {
        headers: { origin: "http://127.0.0.1:3100" },
        data: { email, password: PASSWORD },
      });
      if (response.ok()) return;
      lastError = new Error(`sign-in for ${email} failed with ${response.status()}`);
    } catch (error) {
      // A keep-alive socket can be closed by the server between role switches.
      lastError = error;
    }
    await page.waitForTimeout(300);
  }
  throw lastError instanceof Error ? lastError : new Error(`sign-in for ${email} failed`);
}

test.describe.configure({ mode: "serial" });

test.describe("admin", () => {
  test("shows live KPIs and a server-driven users table with CSV", async ({ page }) => {
    await signInAs(page, ADMIN);
    await page.goto("/ar/admin", { waitUntil: "networkidle" });

    await expect(page.getByRole("heading", { level: 2, name: "نظرة عامة" })).toBeVisible();
    const kpis = page.locator("dl dd");
    await expect(kpis).toHaveCount(17);
    for (let index = 0; index < 5; index += 1) {
      const value = await kpis.nth(index).innerText();
      expect(value.length).toBeGreaterThan(0);
    }

    await page.goto("/ar/admin/users", { waitUntil: "networkidle" });
    await expect(page.locator("tbody tr")).toHaveCount(20);
    await expect(page.getByRole("status").first()).toContainText("من");

    await page.getByLabel("بحث").fill("admin@midad.test");
    await page.getByRole("button", { name: "تطبيق" }).click();
    await page.waitForURL(/q=admin/);
    await expect(page.locator("tbody tr")).toHaveCount(1);
    await expect(page.locator("tbody tr").first()).toContainText("admin@midad.test");

    await page.goto("/ar/admin/users?role=ADMIN&sort=role&dir=asc", { waitUntil: "networkidle" });
    await expect(page.locator("tbody tr").first()).toContainText("مدير");

    // Export the filtered view the admin just searched; an unfiltered export is capped at 10k rows
    // and the accumulated fixture users long ago pushed the seed admin out of that window.
    const csv = await page.request.get("/api/admin/users/export?lang=ar&q=admin%40midad.test");
    expect(csv.status()).toBe(200);
    expect(csv.headers()["content-type"]).toContain("text/csv");
    const body = await csv.text();
    expect(body.startsWith("\uFEFF")).toBe(true);
    expect(body).toContain("admin@midad.test");
  });

  test("changes a role, bans and unbans, then impersonates and returns", async ({ page }) => {
    await signInAs(page, ADMIN);
    await page.goto(`/ar/admin/users?q=${encodeURIComponent(targetUser.email)}`, {
      waitUntil: "networkidle",
    });

    const row = page.locator("tbody tr").filter({ hasText: targetUser.email });
    await expect(row).toBeVisible();

    const role = page.getByLabel(`دور ${targetUser.name}`);
    await role.selectOption("INSTRUCTOR");
    await expect(role).toHaveValue("INSTRUCTOR");
    await role.selectOption("STUDENT");
    await expect(role).toHaveValue("STUDENT");

    await row.getByRole("button", { name: "حظر" }).click();
    await page.getByLabel("سبب الحظر").fill("مخالفة شروط الاستخدام بعد تكرار المحاولات.");
    await page.getByRole("button", { name: "احظر الحساب" }).click();
    await expect(page.locator("tbody tr").filter({ hasText: targetUser.email })).toContainText(
      "محظور",
    );

    const blocked = await page.request.post("/api/auth/sign-in/email", {
      headers: { origin: "http://127.0.0.1:3100" },
      data: { email: targetUser.email, password: PASSWORD },
    });
    expect(blocked.ok()).toBe(false);

    const bannedRow = page.locator("tbody tr").filter({ hasText: targetUser.email });
    await bannedRow.getByRole("button", { name: "رفع الحظر" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "ارفع الحظر" }).click();
    await expect(page.locator("tbody tr").filter({ hasText: targetUser.email })).toContainText(
      "نشط",
      { timeout: 20_000 },
    );

    const activeRow = page.locator("tbody tr").filter({ hasText: targetUser.email });
    await activeRow.getByRole("button", { name: "انتحال الهوية" }).click();
    await page.getByRole("button", { name: "ابدأ الانتحال" }).click();
    await page.waitForURL(/\/ar$/, { timeout: 20_000 });
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/أنت تنتحل شخصية/)).toBeVisible();

    await page.goto("/ar/settings", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { level: 1, name: "إعدادات الحساب" })).toBeVisible();
    await page.getByRole("button", { name: "أوقف الانتحال" }).click();
    await page.waitForURL(/\/ar\/admin\/users/, { timeout: 20_000 });
    await expect(page.getByText(/أنت تنتحل شخصية/)).toHaveCount(0);
  });

  test("approves one course and rejects another with notes", async ({ page }) => {
    await signInAs(page, ADMIN);
    await page.goto(`/ar/admin/courses?q=${encodeURIComponent(approveCourse.titleAr)}`, {
      waitUntil: "networkidle",
    });

    await page
      .locator("tbody tr")
      .filter({ hasText: approveCourse.titleAr })
      .getByRole("link", { name: "مراجعة" })
      .click();
    await page.waitForURL(/\/admin\/courses\/.+/);
    await page.locator("#approve-note").fill("محتوى مكتمل، نُشر بعد المراجعة.");
    await page.getByRole("button", { name: "انشر الدورة" }).click();
    await expect(page.getByText("منشورة").first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("إدارة النشر")).toBeVisible();

    await page.goto(`/ar/admin/courses?q=${encodeURIComponent(rejectCourse.titleAr)}`, {
      waitUntil: "networkidle",
    });
    await page
      .locator("tbody tr")
      .filter({ hasText: rejectCourse.titleAr })
      .getByRole("link", { name: "مراجعة" })
      .click();
    await page.waitForURL(/\/admin\/courses\/.+/);
    await page
      .locator("#reject-reason")
      .fill("الوصف لا يحدد المتعلم المستهدف، والدروس تحتاج أمثلة عملية.");
    await page.locator("#reject-note-lessons").fill("أضف مثالًا عمليًا في كل درس.");
    await page.getByRole("button", { name: "ارفض الدورة" }).click();
    await expect(page.getByText("مرفوضة").first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/الوصف لا يحدد المتعلم المستهدف/)).toBeVisible();
  });

  test("approves and rejects instructor applications", async ({ page }) => {
    await signInAs(page, ADMIN);
    await page.goto(`/ar/admin/applications?q=${encodeURIComponent(approveApplicant.email)}`, {
      waitUntil: "networkidle",
    });

    await page
      .locator("tbody tr")
      .filter({ hasText: approveApplicant.email })
      .getByRole("link", { name: "مراجعة" })
      .click();
    await page.waitForURL(/\/admin\/applications\/.+/);
    await page.getByRole("button", { name: "اقبل ورقِّ إلى مدرب" }).click();
    await expect(page.getByText("مقبول").first()).toBeVisible({ timeout: 20_000 });

    await page.goto(`/ar/admin/users?q=${encodeURIComponent(approveApplicant.email)}`, {
      waitUntil: "networkidle",
    });
    await expect(page.locator("tbody tr").first()).toContainText("مدرب");

    await page.goto(`/ar/admin/applications?q=${encodeURIComponent(rejectApplicant.email)}`, {
      waitUntil: "networkidle",
    });
    await page
      .locator("tbody tr")
      .filter({ hasText: rejectApplicant.email })
      .getByRole("link", { name: "مراجعة" })
      .click();
    await page.waitForURL(/\/admin\/applications\/.+/);
    await page
      .locator("#application-reason")
      .fill("الخبرة عامة ولا تذكر مشاريع أو جهات يمكن التحقق منها.");
    await page.getByRole("button", { name: "ارفض الطلب" }).click();
    await expect(page.getByText("مرفوض").first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/الخبرة عامة/)).toBeVisible();
  });

  test("creates, edits and deletes a category, then reads the audit log", async ({ page }) => {
    await signInAs(page, ADMIN);
    await page.goto("/ar/admin/categories", { waitUntil: "networkidle" });
    const suffix = Date.now().toString(36);
    const originalName = `تصنيف الاختبار الآلي ${suffix}`;
    const editedName = `تصنيف الاختبار الآلي المعدل ${suffix}`;

    await page.getByLabel("الاسم بالإنجليزية").fill(`E2E Category ${suffix}`);
    await page.getByLabel("الاسم بالعربية").fill(originalName);
    await page.getByRole("button", { name: "تصنيف جديد" }).click();
    await expect(page.locator("tbody tr").filter({ hasText: originalName })).toBeVisible();

    const row = page.locator("tbody tr").filter({ hasText: originalName });
    await row.getByRole("button", { name: "تعديل" }).click();
    await page.locator('input[dir="rtl"]').last().fill(editedName);
    await page.getByRole("button", { name: "احفظ التصنيف" }).click();
    await expect(page.getByText(editedName)).toBeVisible();

    const edited = page.locator("tbody tr").filter({ hasText: editedName });
    await edited.getByRole("button", { name: "احذف التصنيف" }).first().click();
    await page.getByRole("button", { name: "احذف التصنيف" }).last().click();
    await expect(page.getByText(editedName)).toHaveCount(0, { timeout: 20_000 });

    await page.goto("/ar/admin/audit?action=category.", { waitUntil: "networkidle" });
    await expect(page.locator("tbody tr").first()).toContainText("category.");

    const csv = await page.request.get("/api/admin/audit/export?lang=ar");
    expect(csv.status()).toBe(200);
    expect(await csv.text()).toContain("category.created");
  });
});
