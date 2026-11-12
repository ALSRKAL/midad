import { expect, test, type Page } from "@playwright/test";

/**
 * Instructor course builder (P04-T01…T06).
 *
 * One disposable course per viewport is built through the real UI on the seeded instructor account:
 * dashboard and draft creation, autosaving basics, cover upload, curriculum ordering, a real
 * multipart video upload processed by the HLS worker, rich text, an attachment, a quiz question,
 * pricing, the submission checklist and the learner preview.
 */

const PASSWORD = "Midad-Test-2026";
const INSTRUCTOR = "instructor.demo@midad.test";

let courseId = "";

async function signIn(page: Page): Promise<void> {
  // Sign in through the API so the session cookie is set before the first navigation. The UI flow
  // itself is covered by auth.spec.ts; here a client-side router push racing the next goto was the
  // only source of flakiness.
  const response = await page.request.post("/api/auth/sign-in/email", {
    headers: { origin: "http://127.0.0.1:3100" },
    data: { email: INSTRUCTOR, password: PASSWORD },
  });
  expect(response.ok()).toBe(true);
}

test.describe.configure({ mode: "serial" });

test.describe("instructor course builder", () => {
  test("the dashboard lists courses and creates a draft", async ({ page }) => {
    await signIn(page);
    await page.goto("/ar/instructor", { waitUntil: "networkidle" });

    await expect(page.getByRole("heading", { name: "نظرة عامة", level: 2 })).toBeVisible();
    await expect(page.getByRole("button", { name: "دورة جديدة" }).first()).toBeVisible();

    await page.getByRole("button", { name: "دورة جديدة" }).first().click();
    await page.waitForURL(/\/instructor\/courses\/.+\/edit/);
    courseId = (page.url().match(/courses\/([^/]+)\/edit/) ?? [])[1] ?? "";
    expect(courseId).not.toBe("");
    await expect(page.getByText("دورة بلا عنوان").first()).toBeVisible();
  });

  test("basics autosave and the cover upload persist", async ({ page }) => {
    await signIn(page);
    await page.goto(`/ar/instructor/courses/${courseId}/edit`, { waitUntil: "networkidle" });

    await page.locator("#titleAr").fill("دورة مُنشئ الاختبار");
    await page.locator("#titleEn").fill("Builder test course");
    await page
      .locator("#descriptionAr")
      .fill("وصف تجريبي يشرح ما ستقدمه الدورة للمتعلم خطوة بخطوة.");
    await expect(page.getByText("حُفظت التغييرات")).toBeVisible({ timeout: 10_000 });

    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=",
      "base64",
    );
    await page.locator('input[aria-label="اختر صورة"]').setInputFiles({
      name: "cover.png",
      mimeType: "image/png",
      buffer: png,
    });
    // The upload is asynchronous; wait until the preview appears before reloading.
    await expect(page.locator('img[src*="covers"]')).toBeVisible({ timeout: 10_000 });

    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator("#titleAr")).toHaveValue("دورة مُنشئ الاختبار");
    // Next's optimizer rewrites the src to /_next/image?url=…covers%2F…; match the encoded key.
    await expect(page.locator('img[src*="covers"]')).toBeVisible();

    await page.getByRole("button", { name: "أضف هدفًا" }).click();
    await page.getByRole("button", { name: "أضف هدفًا" }).click();
    for (const index of [1, 2, 3]) {
      await page.getByLabel(`الهدف ${index} بالعربية`).fill(`هدف تعليمي ${index}`);
      await page.getByLabel(`الهدف ${index} بالإنجليزية`).fill(`Learning objective ${index}`);
    }
    await page.getByRole("button", { name: "احفظ الأهداف" }).click();
    await expect(page.getByText("حُفظت الأهداف.")).toBeVisible();
  });

  test("curriculum adds lessons and persists the order", async ({ page }) => {
    await signIn(page);
    await page.goto(`/ar/instructor/courses/${courseId}/curriculum`, { waitUntil: "networkidle" });

    await page.getByLabel("اسم القسم بالعربية").fill("القسم الأول");
    await page.getByLabel("اسم القسم بالإنجليزية").fill("First section");
    await page.getByRole("button", { name: "أضف القسم" }).click();

    const card = page.locator("main section section").first();
    const details = card.locator("details").first();
    if ((await details.getAttribute("open")) === null) await details.locator("summary").click();

    const lessons = [
      { ar: "الدرس الأول", en: "First lesson" },
      { ar: "الدرس الثاني", en: "Second lesson" },
      { ar: "الدرس الثالث", en: "Third lesson" },
    ] as const;

    for (const lesson of lessons) {
      if ((await details.getAttribute("open")) === null) await details.locator("summary").click();
      await card.getByLabel("عنوان الدرس بالعربية").fill(lesson.ar);
      await card.getByLabel("عنوان الدرس بالإنجليزية").fill(lesson.en);
      await card.getByRole("button", { name: "أضف درسًا" }).click();
      await expect(card.locator("ul li").filter({ hasText: lesson.ar })).toBeVisible();
    }

    await card.getByRole("button", { name: "انقل الدرس الأول لأسفل" }).click();
    await page.waitForTimeout(700);
    await page.reload({ waitUntil: "networkidle" });
    const order = await page.locator("main section section ul li p.truncate").allInnerTexts();
    expect(order.slice(0, 3)).toEqual(["الدرس الثاني", "الدرس الأول", "الدرس الثالث"]);

    await page.getByRole("switch").first().click();
    await page.waitForTimeout(700);
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.getByRole("switch").first()).toHaveAttribute("aria-checked", "true");
  });

  test("a video uploads directly and the worker marks it ready", async ({ page }) => {
    await signIn(page);
    await page.goto(`/ar/instructor/courses/${courseId}/curriculum`, { waitUntil: "networkidle" });
    await page.getByRole("link", { name: "إدارة الدرس" }).first().click();
    await page.waitForURL(/\/curriculum\/.+/);

    await page
      .locator('input[aria-label="اختر ملف فيديو"]')
      .setInputFiles("tests/fixtures/sample.mp4");
    await expect(page.getByText("الفيديو جاهز")).toBeVisible({ timeout: 90_000 });
    await expect(page.getByText(/مدة الفيديو/)).toBeVisible();
  });

  test("text content, an attachment and a quiz question are saved", async ({ page }) => {
    await signIn(page);
    await page.goto(`/ar/instructor/courses/${courseId}/curriculum`, { waitUntil: "networkidle" });
    const card = page.locator("main section section").first();
    const details = card.locator("details").first();
    if ((await details.getAttribute("open")) === null) await details.locator("summary").click();

    const addLesson = async (titleAr: string, titleEn: string, type: string) => {
      if ((await details.getAttribute("open")) === null) await details.locator("summary").click();
      await card.getByLabel("عنوان الدرس بالعربية").fill(titleAr);
      await card.getByLabel("عنوان الدرس بالإنجليزية").fill(titleEn);
      await card.getByLabel("نوع الدرس").selectOption(type);
      await card.getByRole("button", { name: "أضف درسًا" }).click();
      await expect(card.locator("ul li").filter({ hasText: titleAr })).toBeVisible();
    };

    await addLesson("درس نصي مكتمل", "Complete text lesson", "TEXT");
    await addLesson("اختبار قصير", "Short quiz", "QUIZ");

    await page
      .locator("main section section ul li")
      .filter({ hasText: "درس نصي مكتمل" })
      .getByRole("link", { name: "إدارة الدرس" })
      .click();
    await page.locator("#text-content-ar .rich-text").waitFor({ timeout: 20_000 });
    await page
      .locator("#text-content-ar .rich-text")
      .fill(
        "هذا نص تجريبي طويل بما يكفي لتجاوز مئتي حرف، ونضيف إليه تفاصيل عن خطوات الدرس والتمارين التي ينفذها المتعلم بعد كل قسم ليتأكد من فهمه قبل الانتقال.",
      );
    await expect(page.getByText("حُفظ المحتوى")).toBeVisible({ timeout: 10_000 });

    const pdf = Buffer.from(
      "%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF",
    );
    await page.locator('input[aria-label="ارفع مرفقًا"]').setInputFiles({
      name: "handout.pdf",
      mimeType: "application/pdf",
      buffer: pdf,
    });
    await expect(page.getByText("handout.pdf")).toBeVisible();

    await page.goto(`/ar/instructor/courses/${courseId}/curriculum`, { waitUntil: "networkidle" });
    await page
      .locator("main section section ul li")
      .filter({ hasText: "اختبار قصير" })
      .getByRole("link", { name: "إدارة الدرس" })
      .click();
    await page.getByRole("button", { name: "أضف سؤالًا" }).click();
    await page.getByLabel("نص السؤال بالعربية").fill("ما عاصمة السعودية؟");
    await page.getByLabel("نص السؤال بالإنجليزية").fill("What is the capital of Saudi Arabia?");
    await page.getByLabel(/^الخيار بالعربية 1$/).fill("الرياض");
    await page.getByLabel(/^الخيار بالإنجليزية 1$/).fill("Riyadh");
    await page.getByLabel(/^الخيار بالعربية 2$/).fill("جدة");
    await page.getByLabel(/^الخيار بالإنجليزية 2$/).fill("Jeddah");
    await page.getByRole("button", { name: "احفظ السؤال" }).click();
    await expect(page.getByText("حُفظ السؤال.")).toBeVisible();
  });

  test("pricing, the checklist and the learner preview are wired", async ({ page }) => {
    await signIn(page);
    await page.goto(`/ar/instructor/courses/${courseId}/publish`, { waitUntil: "networkidle" });

    await page.locator("#course-price").fill("149");
    await page.getByRole("button", { name: "احفظ السعر" }).click();
    await expect(page.getByText("حُفظ السعر.")).toBeVisible();

    const checklist = page.getByRole("region", { name: "قائمة فحص النشر" });
    await expect(checklist).toContainText("صورة الغلاف");
    await expect(checklist).toContainText("ثلاثة أهداف تعليمية على الأقل");

    await page.getByRole("link", { name: "معاينة كما يراها الطالب" }).click();
    await expect(page).toHaveURL(/\/ar\/preview\//);
    await expect(page.getByText(/معاينة كمدرب/)).toBeVisible();
    await expect(page.getByText("الشراء غير متاح في المعاينة.")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("دورة مُنشئ الاختبار");
  });
});
