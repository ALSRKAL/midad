import { expect, test, type Page } from "@playwright/test";

/**
 * Keyboard-only pass over the admin users table (the product requirements, P05).
 *
 * No mouse events: search is typed and submitted with Enter, the sort header is reached by Tab and
 * activated with Enter, and the ban dialog is opened with Enter, checked for contained focus, then
 * closed with Escape with focus restored to its trigger. The fixtures keep `student.new` active, so
 * the row always offers "حظر" and the test never changes data.
 */

const PASSWORD = "Midad-Test-2026";
const ADMIN = "admin@midad.test";

async function signIn(page: Page): Promise<void> {
  const response = await page.request.post("/api/auth/sign-in/email", {
    headers: { origin: "http://127.0.0.1:3100" },
    data: { email: ADMIN, password: PASSWORD },
  });
  expect(response.ok(), "admin sign-in").toBe(true);
}

type FocusTarget = { text: string; role: string; label: string; id: string; inTable: boolean };

/** Tabs until the focused element satisfies `match`; throws with the focus sequence otherwise. */
async function tabUntil(
  page: Page,
  match: (target: FocusTarget) => boolean,
  description: string,
  maxTabs = 140,
): Promise<FocusTarget> {
  const seen: string[] = [];
  for (let index = 0; index < maxTabs; index += 1) {
    await page.keyboard.press("Tab");
    const target = await page.evaluate((): FocusTarget => {
      const active = document.activeElement;
      if (active === null) return { text: "", role: "", label: "", id: "", inTable: false };
      const element = active as HTMLElement;
      return {
        text: (element.innerText ?? element.textContent ?? "").trim().replace(/\s+/g, " "),
        role: element.getAttribute("role") ?? element.tagName.toLowerCase(),
        label: element.getAttribute("aria-label") ?? "",
        id: element.id,
        inTable: element.closest("table") !== null,
      };
    });
    seen.push(`${target.role}:${target.label || target.text}`.slice(0, 80));
    if (match(target)) return target;
  }
  throw new Error(`Tab never reached ${description}. Focus order:\n${seen.join("\n")}`);
}

test("searches, sorts and closes the ban dialog using only the keyboard", async ({ page }) => {
  await signIn(page);
  await page.goto("/ar/admin/users", { waitUntil: "networkidle" });

  // Search: type and submit from the input itself.
  await tabUntil(
    page,
    (target) => target.role === "input" && target.id === "admin-search",
    "the search input",
  );
  await page.keyboard.type("student.new");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/q=student\.new/);
  await expect(page.locator("tbody tr")).toHaveCount(1);

  // Sorting: the header is a real link, reachable by Tab and activated by Enter.
  const sortTarget = await tabUntil(
    page,
    (target) => target.role === "a" && target.inTable && target.text.includes("الدور"),
    "the role sort link",
  );
  expect(sortTarget.text).toContain("الدور");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/sort=role/);
  await expect(page.locator('th[aria-sort="ascending"]')).toBeVisible();

  // Ban dialog: Enter opens it, focus starts inside, Escape closes and returns focus to the trigger.
  await page.goto("/ar/admin/users?q=student.new", { waitUntil: "networkidle" });
  const trigger = await tabUntil(
    page,
    (target) => target.role === "button" && target.text === "حظر",
    "the ban button",
  );
  expect(trigger.text).toBe("حظر");
  await page.keyboard.press("Enter");

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const focusedInside = await page.evaluate(() => {
    const active = document.activeElement;
    const element = document.querySelector('[role="dialog"]');
    return active !== null && element !== null && element.contains(active);
  });
  expect(focusedInside, "focus moves into the dialog").toBe(true);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  // Radix restores focus after the close animation starts, so poll rather than reading once.
  await expect(page.getByRole("button", { name: "حظر" })).toBeFocused();
});
