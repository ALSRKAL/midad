import { expect, test } from "@playwright/test";

/**
 * Static pages, instructor, category and the contact form (P03-T04, the product requirements).
 *
 * Every footer destination is opened, the FAQ answers are proven to expand, and a real contact
 * message is validated and accepted. The row it creates is checked against the database in the
 * task evidence; from the browser the success state is the contract.
 */

test.describe("public pages", () => {
  test("about, terms and privacy render real copy", async ({ page }) => {
    const pages = [
      { path: "/ar/about", heading: "من نحن" },
      { path: "/ar/terms", heading: "شروط الاستخدام" },
      { path: "/ar/privacy", heading: "سياسة الخصوصية" },
    ];

    for (const item of pages) {
      const response = await page.goto(item.path);
      expect(response?.status(), item.path).toBe(200);
      await expect(page.getByRole("heading", { level: 1, name: item.heading })).toBeVisible();
      const body = await page.locator("main").innerText();
      expect(body.length, `${item.path} copy is too short`).toBeGreaterThan(400);
    }
  });

  test("FAQ answers expand from the keyboard-operable disclosure", async ({ page }) => {
    await page.goto("/ar/faq");

    await expect(page.getByRole("heading", { level: 1, name: "الأسئلة الشائعة" })).toBeVisible();
    await expect(page.locator("details")).toHaveCount(6);

    const first = page.locator("details").first();
    await expect(first.locator("p")).toBeHidden();
    await first.locator("summary").click();
    await expect(first.locator("p")).toBeVisible();
    await expect(first.locator("p")).toContainText("معاينة مجانية");
  });

  test("contact form validates and accepts a message", async ({ page }) => {
    await page.goto("/ar/contact");
    await expect(page.getByRole("heading", { level: 1, name: "تواصل معنا" })).toBeVisible();

    await page.getByLabel("الاسم").fill("زائر الاختبار");
    await page.getByLabel("البريد الإلكتروني").fill(`contact-${Date.now()}@midad.test`);
    await page.getByLabel("الموضوع").fill("سؤال عن دورة التصميم");
    await page.getByLabel("الرسالة").fill("قصيرة");
    await page.getByRole("button", { name: "أرسل الرسالة" }).click();
    await expect(page.locator('p[role="alert"]')).toContainText("20 حرفًا");

    await page
      .getByLabel("الرسالة")
      .fill("أرغب بمعرفة إن كانت دورة التصميم مناسبة لمن لديه خبرة بسيطة، وما المتطلبات المسبقة.");
    await page.getByRole("button", { name: "أرسل الرسالة" }).click();
    await expect(page.getByText("وصلت رسالتك")).toBeVisible();
  });

  test("instructor and category pages list real published courses", async ({ page }) => {
    await page.goto("/ar/instructors/noor-almutairi");
    await expect(page.getByRole("heading", { level: 1, name: "نور المطيري" })).toBeVisible();
    await expect(page.locator("article").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "الموقع" })).toHaveAttribute(
      "href",
      "https://noor-almutairi.example",
    );

    await page.goto("/ar/categories/design");
    await expect(
      page.getByRole("heading", { level: 1, name: "التصميم وتجربة المستخدم" }),
    ).toBeVisible();
    await expect(page.locator("article").first()).toBeVisible();

    const missing = await page.goto("/ar/instructors/nobody-here");
    expect(missing?.status()).toBe(404);
    await page.goto("/ar/categories/not-a-category");
    await expect(page.getByRole("heading", { name: "لم نجد هذه الصفحة" })).toBeVisible();
  });
});
