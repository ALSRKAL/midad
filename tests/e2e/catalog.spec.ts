import { expect, test } from "@playwright/test";

/**
 * Catalog (P03-T02, the product requirements).
 *
 * The URL is the state: a search term with Arabic diacritics, filter combinations, sorting,
 * pagination and the empty state all have to survive a reload and produce the same result set.
 */

test.describe("catalog", () => {
  test("lists the first page of published courses", async ({ page }) => {
    await page.goto("/ar/courses");

    await expect(page.getByRole("heading", { level: 1, name: "الدورات" })).toBeVisible();
    await expect(page.locator("article")).toHaveCount(12);
    await expect(page.getByRole("status").first()).toContainText("دورة");
    await expect(page.getByRole("navigation", { name: /الصفحة 1 من/ })).toBeVisible();
  });

  test("search ignores Arabic diacritics and keeps the term in the URL", async ({ page }) => {
    // تَصْمِيم with tashkeel must match the normalised "تصميم".
    await page.goto(`/ar/courses?q=${encodeURIComponent("تَصْمِيم")}`);

    await expect(page.getByLabel("ابحث في الدورات")).toHaveValue("تَصْمِيم");
    await expect(page.getByRole("status").first()).not.toContainText("لا نتائج");
    await expect(page.locator("article").first()).toBeVisible();

    await page.reload();
    await expect(page).toHaveURL(/q=/);
    await expect(page.getByRole("status").first()).not.toContainText("لا نتائج");
  });

  test("filters by category and level, and sorting puts free courses first", async ({ page }) => {
    await page.goto("/ar/courses?category=programming&level=BEGINNER");
    await expect(page).toHaveURL(/category=programming/);
    await expect(page).toHaveURL(/level=BEGINNER/);
    const filtered = page.getByRole("status").first();
    await expect(filtered).not.toContainText("لا نتائج");

    const cards = await page.locator("article").count();
    expect(cards).toBeGreaterThan(0);
    expect(cards).toBeLessThan(12);

    await page.goto("/ar/courses?sort=price-asc");
    await expect(page.locator("article").first()).toContainText("مجاني");
  });

  test("paginates and offers a clear way out of an empty result", async ({ page }) => {
    await page.goto("/ar/courses");
    await page.getByRole("link", { name: "التالي" }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByRole("navigation", { name: /الصفحة 2 من/ })).toBeVisible();
    await expect(page.locator("article").first()).toBeVisible();

    await page.goto("/ar/courses?q=zzzzzz");
    await expect(page.getByRole("heading", { name: "لا دورة تطابق بحثك" })).toBeVisible();
    // The sidebar and the empty state both offer "clear filters"; use the one inside the state.
    await page.getByRole("link", { name: "مسح الفلاتر" }).last().click();
    await expect(page).toHaveURL(/\/ar\/courses$/);
    await expect(page.locator("article")).toHaveCount(12);
  });
});
