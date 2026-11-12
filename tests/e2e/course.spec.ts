import { expect, test } from "@playwright/test";

/**
 * Course detail (P03-T03, the product requirements).
 *
 * The page must be complete from real data — objectives, curriculum with preview markers, reviews,
 * instructor, similar courses — and its JSON-LD must say the same thing as the visible page.
 * Publication states are proven too: draft and archived are 404, unlisted is reachable directly.
 */

const PUBLISHED = "/ar/courses/modern-react-app-development";

test.describe("course page", () => {
  test("renders the curriculum, preview marker, instructor and reviews from the database", async ({
    page,
  }) => {
    await page.goto(PUBLISHED);

    await expect(page.getByRole("heading", { level: 1 })).toContainText("تطبيقات React الحديثة");
    await expect(page.getByRole("heading", { name: "ماذا ستتعلم" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "المنهج" })).toBeVisible();
    await expect(page.locator("details")).toHaveCount(3);
    await expect(page.getByText("معاينة مجانية").first()).toBeVisible();

    await expect(page.getByRole("link", { name: "الملف الكامل للمدرب" })).toHaveAttribute(
      "href",
      "/ar/instructors/noor-almutairi",
    );
    await expect(page.getByRole("heading", { name: "التقييمات" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "دورات مشابهة" })).toBeVisible();
  });

  test("publishes JSON-LD that matches the visible course", async ({ page }) => {
    await page.goto("/ar/courses/design-systems-in-figma");

    const raw = await page.locator('script[type="application/ld+json"]').innerText();
    const data = JSON.parse(raw) as {
      "@type": string;
      name: string;
      inLanguage: string;
      offers: { priceCurrency: string; price: string };
      aggregateRating?: { reviewCount: number; ratingValue: string };
    };

    expect(data["@type"]).toBe("Course");
    expect(data.name).toContain("أنظمة التصميم في Figma");
    expect(data.inLanguage).toBe("ar");
    expect(data.offers.priceCurrency).toBe("SAR");
    expect(data.aggregateRating?.reviewCount).toBe(3);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(data.name);
  });

  test("a guest can add to the cart while the wishlist still routes through sign-in", async ({
    page,
  }) => {
    await page.goto(PUBLISHED);

    const add = page.getByRole("button", { name: "أضف إلى السلة" });
    await expect(add).toBeVisible();
    await add.click();
    await expect(page.getByRole("button", { name: "في السلة — أزل" })).toBeVisible();

    const wishlist = page.getByRole("link", { name: "أضف إلى المفضلة" });
    const wishlistHref = await wishlist.getAttribute("href");
    expect(wishlistHref).toContain("/ar/login?next=");
    expect(decodeURIComponent(wishlistHref ?? "")).toContain(
      "/ar/courses/modern-react-app-development",
    );
  });

  test("a draft is 404, an archived course stays readable but unsellable, and unlisted is reachable", async ({
    page,
  }) => {
    const draft = await page.goto("/ar/courses/financial-analysis-and-ratios");
    expect(draft?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "لم نجد هذه الصفحة" })).toBeVisible();

    // BR-04: archived courses leave search and sale but keep a direct, readable page (and enrolled
    // learners keep their "go to course" action).
    const archived = await page.goto("/ar/courses/instructional-design-essentials");
    expect(archived?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "هذه الدورة لم تعد متاحة للشراء." }),
    ).toBeDisabled();

    const unlisted = await page.goto("/ar/courses/google-ads-campaign-management");
    expect(unlisted?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "إدارة حملات إعلانات البحث",
    );
  });
});
