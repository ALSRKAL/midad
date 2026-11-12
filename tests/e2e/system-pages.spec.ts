import { expect, test } from "@playwright/test";

/**
 * The health endpoint must exercise real dependencies, not return a constant.
 *
 * The suite runs against the local stack (Postgres, Redis, MinIO, Mailpit are up in dev/CI), so a
 * 200 here means the wiring actually works. The response must never leak versions or credentials.
 */
test("GET /api/health reports every dependency", async ({ request }) => {
  const response = await request.get("/api/health");
  const body = (await response.json()) as {
    status: string;
    checkedAt: string;
    checks: Array<{ name: string; ok: boolean; required: boolean; durationMs: number }>;
  };

  expect(response.status()).toBe(200);
  expect(body.status).toBe("ok");
  expect(new Date(body.checkedAt).toString()).not.toBe("Invalid Date");

  const names = body.checks.map((check) => check.name).sort();
  expect(names).toEqual(["database", "mail", "redis", "storage"]);
  expect(body.checks.every((check) => check.ok)).toBe(true);

  const serialised = JSON.stringify(body);
  expect(serialised).not.toMatch(/postgres(ql)?:\/\//);
  expect(serialised).not.toContain("password");
});

test("health responses are not cached", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.headers()["cache-control"]).toContain("no-store");
});

test("an unknown page returns the localized 404 with a way back", async ({ page }) => {
  const response = await page.goto("/ar/this-page-does-not-exist");
  expect(response?.status()).toBe(404);

  await expect(page.getByRole("heading", { level: 1 })).toContainText("لم نجد هذه الصفحة");
  await expect(page.getByRole("link", { name: "العودة إلى الرئيسية" })).toBeVisible();
  // The decorative animation must not be announced.
  await expect(page.locator("[data-lottie]")).toHaveAttribute("aria-hidden", "true");
});
