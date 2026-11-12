import { expect, test, type Page } from "@playwright/test";

import { fixture, type FixtureUser } from "../e2e/helpers/fixtures";
import { copy, gotoStable, PASSWORD, unique } from "./helpers";

/**
 * Journey 6 (§13.3): application → admin approval → instructor builds a course with a real video
 * upload → submits → admin rejects with notes → instructor edits and resubmits → admin approves →
 * the course appears in the public catalog and search.
 */

type Applicant = FixtureUser;

/** WebKit occasionally resets the keep-alive connection between repeated API sign-ins. */
async function signInApi(page: Page, email: string, password: string): Promise<void> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await page.request.post("/api/auth/sign-in/email", {
        headers: { origin: "http://127.0.0.1:3100" },
        data: { email, password },
      });
      if (response.ok()) return;
      lastError = new Error(`sign-in failed with ${response.status()}`);
    } catch (error) {
      lastError = error;
    }
    await page.waitForTimeout(300);
  }
  throw lastError instanceof Error ? lastError : new Error("sign-in failed");
}

for (const locale of ["ar", "en"] as const) {
  test(`instructor application to published course in ${locale}`, async ({ page }) => {
    test.setTimeout(300_000);
    const applicant = await fixture<Applicant>("/application", {
      field: locale === "ar" ? "تطوير الويب" : "Web development",
    });
    const suffix = unique("journey6");
    const titleAr = `دورة رحلة المدرب ${suffix}`;
    const titleEn = `Instructor journey course ${suffix}`;

    // Admin approves the seeded pending application.
    await signInApi(page, "admin@midad.test", PASSWORD);
    await gotoStable(
      page,
      `/${locale}/admin/applications?q=${encodeURIComponent(applicant.email)}`,
    );
    await page
      .locator("tbody tr")
      .filter({ hasText: applicant.email })
      .getByRole("link", { name: copy(locale, "مراجعة", "Review") })
      .click();
    await page.waitForURL(/\/admin\/applications\/.+/);
    await page
      .getByRole("button", {
        name: copy(locale, "اقبل ورقِّ إلى مدرب", "Approve and promote to instructor"),
      })
      .click();
    await expect(page.getByText(copy(locale, "مقبول", "Approved")).first()).toBeVisible({
      timeout: 20_000,
    });

    await page.context().clearCookies();
    // Clearing the admin session can leave its redirect in flight. Let a neutral guest document
    // settle before signing in, then retry the target document request.
    await gotoStable(page, `/${locale}`);
    await signInApi(page, applicant.email, applicant.password);
    await gotoStable(page, `/${locale}/instructor`);
    await page
      .getByRole("button", { name: copy(locale, "دورة جديدة", "New course") })
      .first()
      .click();
    await page.waitForURL(/\/instructor\/courses\/.+\/edit/);
    const courseId = (page.url().match(/courses\/([^/]+)\/edit/) ?? [])[1] ?? "";
    expect(courseId).not.toBe("");

    await page.locator("#titleAr").fill(titleAr);
    await page.locator("#titleEn").fill(titleEn);
    await page
      .locator("#descriptionAr")
      .fill(
        locale === "ar"
          ? "وصف تجريبي يشرح ما ستقدمه الدورة للمتعلم خطوة بخطوة مع أمثلة عملية."
          : "A test description explaining what the course offers, step by step, with practical examples.",
      );
    await expect(page.getByText(copy(locale, "حُفظت التغييرات", "Changes saved"))).toBeVisible({
      timeout: 15_000,
    });

    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=",
      "base64",
    );
    await page
      .locator(`input[aria-label="${copy(locale, "اختر صورة", "Choose an image")}"]`)
      .setInputFiles({ name: "cover.png", mimeType: "image/png", buffer: png });
    await expect(page.locator('img[src*="covers"]')).toBeVisible({ timeout: 20_000 });

    await page.getByRole("button", { name: copy(locale, "أضف هدفًا", "Add an objective") }).click();
    await page.getByRole("button", { name: copy(locale, "أضف هدفًا", "Add an objective") }).click();
    for (const index of [1, 2, 3]) {
      await page
        .getByLabel(copy(locale, `الهدف ${index} بالعربية`, `Objective ${index} in Arabic`))
        .fill(`هدف تعليمي ${index}`);
      await page
        .getByLabel(copy(locale, `الهدف ${index} بالإنجليزية`, `Objective ${index} in English`))
        .fill(`Learning objective ${index}`);
    }
    await page
      .getByRole("button", { name: copy(locale, "احفظ الأهداف", "Save objectives") })
      .click();

    await gotoStable(page, `/${locale}/instructor/courses/${courseId}/curriculum`);
    await page
      .getByLabel(copy(locale, "اسم القسم بالعربية", "Section name in Arabic"))
      .fill("القسم الأول");
    await page
      .getByLabel(copy(locale, "اسم القسم بالإنجليزية", "Section name in English"))
      .fill("First section");
    await page.getByRole("button", { name: copy(locale, "أضف القسم", "Add section") }).click();

    const card = page.locator("main section section").first();
    const details = card.locator("details").first();
    if ((await details.getAttribute("open")) === null) await details.locator("summary").click();
    await page
      .getByLabel(copy(locale, "عنوان الدرس بالعربية", "Lesson title in Arabic"))
      .fill("درس الفيديو");
    await page
      .getByLabel(copy(locale, "عنوان الدرس بالإنجليزية", "Lesson title in English"))
      .fill("Video lesson");
    await page.getByLabel(copy(locale, "نوع الدرس", "Lesson type")).selectOption("VIDEO");
    await page.getByRole("button", { name: copy(locale, "أضف درسًا", "Add a lesson") }).click();

    await page
      .getByRole("link", { name: copy(locale, "إدارة الدرس", "Manage lesson") })
      .first()
      .click();
    await page.waitForURL(/\/curriculum\/.+/);
    await page
      .locator(`input[aria-label="${copy(locale, "اختر ملف فيديو", "Choose a video file")}"]`)
      .setInputFiles("tests/fixtures/sample.mp4");
    await expect(page.getByText(copy(locale, "الفيديو جاهز", "The video is ready"))).toBeVisible({
      timeout: 120_000,
    });

    // The remaining four text lessons and objectives are provisioned through the test API so this
    // journey spends its time on the real upload and review flow rather than repeating form filling.
    const completed = await fixture<{ lessonCount: number }>("/complete-course", { courseId });
    expect(completed.lessonCount).toBeGreaterThanOrEqual(5);

    await gotoStable(page, `/${locale}/instructor/courses/${courseId}/publish`);
    await page.locator("#course-price").fill("149");
    await page.getByRole("button", { name: copy(locale, "احفظ السعر", "Save price") }).click();
    await expect(page.getByText(copy(locale, "حُفظ السعر.", "Price saved."))).toBeVisible({
      timeout: 20_000,
    });
    const checklist = page.getByRole("region", {
      name: copy(locale, "قائمة فحص النشر", "Submission checklist"),
    });
    await expect(checklist).toContainText(copy(locale, "صورة الغلاف", "Cover image"));
    await expect(checklist).toContainText(
      copy(locale, "ثلاثة أهداف تعليمية على الأقل", "At least three learning objectives"),
    );
    await page
      .getByRole("button", { name: copy(locale, "أرسل للمراجعة", "Submit for review") })
      .click();
    await expect(
      page.getByText(
        copy(
          locale,
          "الدورة قيد المراجعة من فريق المنصة",
          "The course is under review by the platform team",
        ),
      ),
    ).toBeVisible({ timeout: 20_000 });

    // Admin rejects with a reason.
    await page.context().clearCookies();
    await gotoStable(page, `/${locale}`);
    await signInApi(page, "admin@midad.test", PASSWORD);
    await gotoStable(page, `/${locale}/admin/courses/${courseId}`);
    await page
      .locator("#reject-reason")
      .fill(
        locale === "ar"
          ? "أضف مثالًا عمليًا واضحًا في كل درس قبل النشر."
          : "Add a clear practical example to every lesson before publishing.",
      );
    await page
      .getByRole("button", { name: copy(locale, "ارفض الدورة", "Reject the course") })
      .click();
    await expect(page.getByText(copy(locale, "مرفوضة", "Rejected")).first()).toBeVisible({
      timeout: 20_000,
    });

    // Instructor edits the title and resubmits.
    await page.context().clearCookies();
    await gotoStable(page, `/${locale}`);
    await signInApi(page, applicant.email, applicant.password);
    await gotoStable(page, `/${locale}/instructor/courses/${courseId}/edit`);
    await page.locator("#titleAr").fill(`${titleAr} المعدلة`);
    await expect(page.getByText(copy(locale, "حُفظت التغييرات", "Changes saved"))).toBeVisible({
      timeout: 15_000,
    });
    await gotoStable(page, `/${locale}/instructor/courses/${courseId}/publish`);
    await page
      .getByRole("button", { name: copy(locale, "أرسل للمراجعة", "Submit for review") })
      .click();
    await expect(
      page.getByText(
        copy(
          locale,
          "الدورة قيد المراجعة من فريق المنصة",
          "The course is under review by the platform team",
        ),
      ),
    ).toBeVisible({ timeout: 20_000 });

    // Admin approves; the course is now public and searchable.
    await page.context().clearCookies();
    await gotoStable(page, `/${locale}`);
    await signInApi(page, "admin@midad.test", PASSWORD);
    await gotoStable(page, `/${locale}/admin/courses/${courseId}`);
    await page
      .getByRole("button", { name: copy(locale, "انشر الدورة", "Publish the course") })
      .click();
    await expect(page.getByText(copy(locale, "منشورة", "Published")).first()).toBeVisible({
      timeout: 20_000,
    });

    // The unique fixture token is what the catalog search must normalize and match. Poll briefly so
    // an approval's revalidation cannot race the first catalog read.
    const expectedTitle = locale === "ar" ? `${titleAr} المعدلة` : titleEn;
    await expect
      .poll(
        async () => {
          try {
            await gotoStable(page, `/${locale}/courses?q=${encodeURIComponent(suffix)}`);
          } catch {
            // A navigation still overlapping the approval refresh; the poll tries again.
            return 0;
          }
          return page.getByRole("link", { name: new RegExp(expectedTitle) }).count();
        },
        { timeout: 20_000 },
      )
      .toBeGreaterThan(0);
  });
}
