import { expect, test, type APIResponse, type Page } from "@playwright/test";

import { fixture, type FixtureAssessment } from "./helpers/fixtures";

/**
 * Assessment journey (P08): start a quiz, answer without any correctness in the payload, submit,
 * review, complete the course and verify/download the issued certificate. Every project owns a
 * freshly built assessment course and learner (P14-T01).
 */

let assessment: FixtureAssessment;
let PASSWORD = "";

/** A server-closed keep-alive socket surfaces as ECONNRESET on a cached API context. */
async function getWithRetry(page: Page, url: string): Promise<APIResponse> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await page.request.get(url);
    } catch (error) {
      lastError = error;
      await page.waitForTimeout(300);
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`GET ${url} failed`);
}

test.beforeAll(async () => {
  assessment = await fixture<FixtureAssessment>("/assessment");
  PASSWORD = assessment.password;
});

test.describe.configure({ mode: "serial" });

async function signIn(page: Page): Promise<void> {
  const response = await page.request.post("/api/auth/sign-in/email", {
    headers: { origin: "http://127.0.0.1:3100" },
    data: { email: assessment.email, password: PASSWORD },
  });
  expect(response.ok(), "learner sign-in").toBe(true);
}

test("answers are not exposed before submission and a passing attempt completes the course", async ({
  page,
}) => {
  await signIn(page);
  await page.goto(`/ar/learn/${assessment.courseSlug}/${assessment.quizLessonId}`, {
    waitUntil: "networkidle",
  });
  await page.getByRole("button", { name: /ابدأ الاختبار|أكمل المحاولة/ }).click();
  await page.waitForURL(/\/quiz\?attempt=/, { timeout: 20_000 });

  const html = await page.content();
  expect(html).not.toContain('"isCorrect":');
  expect(html).not.toContain('"acceptedAnswers":');

  const singleQuestion = page.locator("li").filter({ hasText: "ما ناتج ٢ + ٢؟" });
  await singleQuestion.getByLabel(assessment.answers.single).check();
  const multiQuestion = page.locator("li").filter({ hasText: "اختر الأرقام الزوجية" });
  for (const answer of assessment.answers.multi) {
    await multiQuestion.getByLabel(answer).check();
  }
  await page.getByRole("textbox").fill(assessment.answers.short);
  await page.getByRole("button", { name: "سلّم الاختبار" }).click();

  await expect(page.getByText("نجحت في الاختبار")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("مراجعة الإجابات")).toBeVisible();
});

test("completing the last lesson issues one verifiable certificate with a PDF", async ({
  page,
}) => {
  await signIn(page);
  await page.goto(`/ar/learn/${assessment.courseSlug}/${assessment.textLessonId}`, {
    waitUntil: "networkidle",
  });
  await page.getByRole("button", { name: "أكملت الدرس" }).click();
  await expect(page.getByText("أكملت هذا الدرس")).toBeVisible();

  await page.goto("/ar/dashboard", { waitUntil: "networkidle" });
  const certificateLink = page.locator('a[href*="/verify/MD-"]').first();
  await expect(certificateLink).toBeVisible();
  const href = await certificateLink.getAttribute("href");
  expect(href).not.toBeNull();

  await page.goto(href ?? "", { waitUntil: "networkidle" });
  // The name also exists in the desktop header, hidden on mobile; assert the certificate content.
  await expect(page.getByRole("main").getByText(assessment.name).first()).toBeVisible();
  await expect(page.getByText("شهادة صادرة من مِداد")).toBeVisible();

  const linkedIn = page.getByRole("link", { name: "شارك على LinkedIn" });
  await expect(linkedIn).toHaveAttribute("href", /linkedin\.com\/sharing/);

  const code = (href ?? "").split("/verify/")[1] ?? "";
  const pdf = await getWithRetry(page, `/api/certificates/${code}/pdf`);
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()["content-type"]).toContain("application/pdf");
  const bytes = await pdf.body();
  expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");
});
