import { expect, test } from "@playwright/test";

/**
 * Home page (P03-T01, the product requirements).
 *
 * Proves the page is fed by the database rather than hard-coded copy: non-zero counters, eight real
 * categories, both course rails, four instructors with profile links, and the teach CTA leading to
 * a working application page.
 */

test.describe("home page", () => {
  test("shows live counters, categories, course rails and instructors", async ({ page }) => {
    await page.goto("/ar");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("تعلّم مهارة");

    const stats = page.locator("dl dd");
    await expect(stats).toHaveCount(4);
    for (let index = 0; index < 4; index += 1) {
      const value = await stats.nth(index).innerText();
      expect(Number(value.replace(/[^\d]/g, "")), `stat ${index} is ${value}`).toBeGreaterThan(0);
    }

    const categories = page.getByRole("region", { name: "تصفح حسب المجال" });
    await expect(categories.getByRole("listitem").getByRole("link")).toHaveCount(8);

    // Best sellers and newest rails, four cards each.
    await expect(page.locator("article")).toHaveCount(8);

    const instructorLinks = page.getByRole("link", { name: /الملف الشخصي/ });
    await expect(instructorLinks).toHaveCount(4);
    await expect(instructorLinks.first()).toHaveAttribute("href", /\/ar\/instructors\//);

    await expect(page.getByRole("heading", { name: "ماذا يقول المتعلمون" })).toBeVisible();
    await expect(page.getByRole("link", { name: /^عن دورة/ }).first()).toHaveAttribute(
      "href",
      /\/ar\/courses\//,
    );
  });

  test("the hero search lands on the catalog with the query", async ({ page }) => {
    await page.goto("/ar");
    await page.getByLabel("ابحث عن دورة").fill("تصميم");
    await page.getByRole("button", { name: "ابحث" }).click();

    await expect(page).toHaveURL(/\/ar\/courses\?q=/);
    await expect(page.getByRole("heading", { level: 1, name: "الدورات" })).toBeVisible();
    await expect(page.locator("article").first()).toBeVisible();
    await expect(page.getByRole("status").first()).not.toContainText("لا نتائج");
  });

  test("the category cards and the teach call to action are real destinations", async ({
    page,
  }) => {
    await page.goto("/ar");
    await page
      .getByRole("region", { name: "تصفح حسب المجال" })
      .getByRole("link", { name: /البرمجة/ })
      .click();

    await expect(page).toHaveURL(/\/ar\/courses\?category=programming/);
    await expect(page.getByRole("heading", { level: 1, name: "الدورات" })).toBeVisible();

    await page.goto("/ar");
    await page.getByRole("link", { name: "قدّم طلب التدريب" }).click();
    // Anonymous visitors meet the auth gate, with a return path to the application form.
    await expect(page).toHaveURL(/\/ar\/login\?next=/);
    await expect(page.getByRole("heading", { level: 1, name: "تسجيل الدخول" })).toBeVisible();
  });
});
