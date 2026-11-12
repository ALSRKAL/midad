import { expect, test } from "@playwright/test";

import { fixture, type FixtureUser } from "../e2e/helpers/fixtures";
import { copy, PASSWORD } from "./helpers";

/**
 * Journey 9 (§13.3): an admin bans a user who is signed in elsewhere; that session dies on the next
 * request. The admin then unbans, impersonates the user (warning bar) and the audit log records it.
 */

for (const locale of ["ar", "en"] as const) {
  test(`ban ends another session and impersonation is audited in ${locale}`, async ({
    page,
    browser,
  }) => {
    const target = await fixture<FixtureUser>("/user", {
      role: "STUDENT",
      name: copy(locale, "هدف الحظر", "Ban target"),
    });
    const victimContext = await browser.newContext();
    const victim = await victimContext.newPage();
    const victimSignIn = await victim.request.post("/api/auth/sign-in/email", {
      headers: { origin: "http://127.0.0.1:3100" },
      data: { email: target.email, password: target.password },
    });
    expect(victimSignIn.ok()).toBe(true);
    await victim.goto(`/${locale}/dashboard`, { waitUntil: "networkidle" });
    await expect(victim.getByRole("heading", { level: 1 })).toBeVisible();

    await page.request.post("/api/auth/sign-in/email", {
      headers: { origin: "http://127.0.0.1:3100" },
      data: { email: "admin@midad.test", password: PASSWORD },
    });
    await page.goto(`/${locale}/admin/users?q=${encodeURIComponent(target.email)}`, {
      waitUntil: "networkidle",
    });
    const row = page.locator("tbody tr").filter({ hasText: target.email });
    await row.getByRole("button", { name: copy(locale, "حظر", "Ban") }).click();
    await page
      .getByLabel(copy(locale, "سبب الحظر", "Reason for the ban"))
      .fill(copy(locale, "مخالفة شروط الاستخدام.", "Terms of use violation."));
    await page
      .getByRole("button", { name: copy(locale, "احظر الحساب", "Ban the account") })
      .click();
    await expect(page.locator("tbody tr").filter({ hasText: target.email })).toContainText(
      copy(locale, "محظور", "Banned"),
      { timeout: 20_000 },
    );

    // The already-signed-in victim is treated as having no session on the very next request.
    await victim.goto(`/${locale}/dashboard`, { waitUntil: "networkidle" });
    await expect(victim).toHaveURL(new RegExp(`/${locale}/login`), { timeout: 20_000 });

    const bannedRow = page.locator("tbody tr").filter({ hasText: target.email });
    await bannedRow.getByRole("button", { name: copy(locale, "رفع الحظر", "Unban") }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: copy(locale, "ارفع الحظر", "Lift the ban") })
      .click();
    await expect(page.locator("tbody tr").filter({ hasText: target.email })).toContainText(
      copy(locale, "نشط", "Active"),
      { timeout: 20_000 },
    );

    await page
      .locator("tbody tr")
      .filter({ hasText: target.email })
      .getByRole("button", { name: copy(locale, "انتحال الهوية", "Impersonate") })
      .click();
    await page
      .getByRole("button", { name: copy(locale, "ابدأ الانتحال", "Start impersonating") })
      .click();
    await page.waitForURL(new RegExp(`/${locale}$`), { timeout: 20_000 });
    await expect(
      page.getByText(copy(locale, "أنت تنتحل شخصية", "You are impersonating")),
    ).toBeVisible();
    await page
      .getByRole("button", { name: copy(locale, "أوقف الانتحال", "Stop impersonating") })
      .click();
    await page.waitForURL(/\/admin\/users/, { timeout: 20_000 });
    await page.waitForLoadState("networkidle");

    await page.goto(`/${locale}/admin/audit?q=user.impersonationStarted`, {
      waitUntil: "networkidle",
    });
    await expect(page.locator("tbody tr").first()).toContainText("user.impersonationStarted");
    await victimContext.close();
  });
}
