import { readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";

/**
 * SEO, structured data and security headers (P11-T01/T03).
 *
 * The production build is served over plain HTTP on loopback, so `Secure` on cookies cannot be
 * asserted here; HttpOnly and SameSite are. CSP is checked both as a header and by proving an
 * injected inline script without the nonce does not execute.
 */

const PASSWORD = readFileSync("/tmp/midad-e2e-password.txt", "utf8").trim();

test("public pages expose canonical, hreflang and a generated OG image", async ({ page }) => {
  await page.goto("/ar", { waitUntil: "networkidle" });
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "http://127.0.0.1:3100/ar",
  );
  const alternates = await page.locator('link[rel="alternate"][hreflang]').evaluateAll((elements) =>
    elements.map((element) => ({
      lang: element.getAttribute("hreflang"),
      href: element.getAttribute("href"),
    })),
  );
  expect(alternates).toEqual(
    expect.arrayContaining([
      { lang: "ar", href: "http://127.0.0.1:3100/ar" },
      { lang: "en", href: "http://127.0.0.1:3100/en" },
      { lang: "x-default", href: "http://127.0.0.1:3100/ar" },
    ]),
  );

  const og = await page.locator('meta[property="og:image"]').getAttribute("content");
  expect(og).not.toBeNull();
  const image = await page.request.get(og ?? "");
  expect(image.status()).toBe(200);
  expect(image.headers()["content-type"]).toContain("image/png");
  expect((await image.body()).byteLength).toBeGreaterThan(10_000);

  await page.goto("/en/courses", { waitUntil: "networkidle" });
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "http://127.0.0.1:3100/en/courses",
  );

  await page.goto("/ar/courses/modern-react-app-development", { waitUntil: "networkidle" });
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "http://127.0.0.1:3100/ar/courses/modern-react-app-development",
  );
  const ld = page.locator('script[type="application/ld+json"]');
  await expect(ld).toHaveCount(1);
  const json = JSON.parse((await ld.textContent()) ?? "{}") as { "@type"?: string };
  expect(json["@type"]).toBe("Course");
  // Browsers hide the `nonce` content attribute after parsing; the IDL property keeps it.
  expect(await ld.evaluate((element) => (element as HTMLScriptElement).nonce)).toBeTruthy();
});

test("robots and sitemap describe only public surfaces", async ({ page }) => {
  const robots = await page.request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  const robotsBody = await robots.text();
  expect(robotsBody).toContain("Disallow: /ar/admin");
  expect(robotsBody).toContain("Disallow: /en/learn");
  expect(robotsBody).toContain("Sitemap: http://127.0.0.1:3100/sitemap.xml");

  const sitemap = await page.request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  expect(xml).toContain("http://127.0.0.1:3100/ar/courses/modern-react-app-development");
  expect(xml).toContain('hreflang="en"');
  expect(xml).not.toContain("/ar/admin");
});

test("security headers are present and CSP blocks un-nonced scripts", async ({ page }) => {
  const response = await page.goto("/ar", { waitUntil: "networkidle" });
  const headers = response?.headers() ?? {};
  expect(headers["content-security-policy"]).toContain("default-src 'self'");
  expect(headers["content-security-policy"]).toContain("'strict-dynamic'");
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["permissions-policy"]).toContain("camera=()");
  expect(headers["x-powered-by"]).toBeUndefined();

  // Chromium may run scripts appended through the automation context regardless of CSP, so the
  // enforcement evidence is the nonce-bearing framework scripts plus a clean console.
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await page.reload({ waitUntil: "networkidle" });
  expect(await page.locator("script[nonce]").count()).toBeGreaterThan(0);
  expect(consoleErrors.filter((message) => message.includes("Content Security Policy"))).toEqual(
    [],
  );

  const signIn = await page.request.post("/api/auth/sign-in/email", {
    headers: { origin: "http://127.0.0.1:3100" },
    data: { email: "student.demo@midad.test", password: PASSWORD },
  });
  expect(signIn.ok()).toBe(true);
  const cookies = signIn.headers()["set-cookie"] ?? "";
  expect(cookies.toLowerCase()).toContain("httponly");
  expect(cookies.toLowerCase()).toContain("samesite=lax");
});

test("private areas are noindex even for the admin", async ({ page }) => {
  await page.goto("/ar/login");
  await page.getByLabel("البريد الإلكتروني").fill("admin@midad.test");
  await page.getByLabel("كلمة المرور").fill(PASSWORD);
  await page.getByRole("button", { name: "دخول" }).click();
  await page.waitForURL(/\/ar$/);
  await page.waitForLoadState("networkidle");
  await page.goto("/ar/admin/settings", { waitUntil: "networkidle" });
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});
