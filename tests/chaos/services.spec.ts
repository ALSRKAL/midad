import { execFileSync, spawn, type ChildProcess } from "node:child_process";

import { expect, test, type Page } from "@playwright/test";

import { fixture } from "../e2e/helpers/fixtures";
import { unique } from "../journeys/helpers";

/**
 * P14-T05 service outages.
 *
 * Redis and MinIO are stopped through docker compose while the app is running; `/api/health` must
 * report 503 with the failing dependency and public pages must keep serving instead of crashing.
 * The worker is paused, a durable email job is enqueued, and it is delivered after the worker
 * returns — proving jobs resume rather than being lost.
 */

const MAILPIT = process.env["MAILPIT_URL"] ?? "http://127.0.0.1:8025";

function compose(action: "stop" | "start", service: string): void {
  execFileSync("docker", ["compose", action, service], { cwd: process.cwd(), stdio: "ignore" });
}

async function health(page: Page): Promise<{ status: number; body: unknown }> {
  const response = await page.request.get("/api/health");
  return { status: response.status(), body: await response.json() };
}

async function waitForHealth(page: Page, ok: boolean): Promise<void> {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    const result = await health(page);
    if ((result.status === 200) === ok) return;
    await page.waitForTimeout(750);
  }
  throw new Error(`health did not become ${ok ? "healthy" : "unhealthy"} in time`);
}

test.describe.configure({ mode: "serial" });

test("redis outage gives a clear 503 and the catalog still renders", async ({ page }) => {
  compose("stop", "redis");
  try {
    await waitForHealth(page, false);
    const result = await health(page);
    expect(result.status).toBe(503);
    expect(JSON.stringify(result.body)).toContain("redis");

    const catalog = await page.goto("/ar/courses", { waitUntil: "networkidle" });
    expect(catalog?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  } finally {
    compose("start", "redis");
  }
  await waitForHealth(page, true);
});

test("storage outage is reported and recovers without a restart", async ({ page }) => {
  compose("stop", "storage");
  try {
    await waitForHealth(page, false);
    const result = await health(page);
    expect(result.status).toBe(503);
    expect(JSON.stringify(result.body)).toContain("storage");

    const course = await page.goto("/ar/courses/modern-react-app-development", {
      waitUntil: "networkidle",
    });
    expect(course?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  } finally {
    compose("start", "storage");
  }
  await waitForHealth(page, true);
});

test("a queued email waits for the worker and is delivered when it returns", async ({ page }) => {
  const address = `${unique("chaos-worker")}@midad.test`;
  try {
    execFileSync("pkill", ["-f", "worker/index.ts"], { stdio: "ignore" });
  } catch {
    // Already stopped.
  }
  await page.waitForTimeout(1_500);
  await fixture("/queue-email", { to: address });

  await page.waitForTimeout(3_000);
  const before = await page.request.get(`${MAILPIT}/api/v1/messages?limit=100`);
  const beforeBody = (await before.json()) as {
    messages: Array<{ To: Array<{ Address: string }> }>;
  };
  expect(
    beforeBody.messages.some((message) =>
      message.To.some((to) => to.Address.toLowerCase() === address),
    ),
  ).toBe(false);

  let worker: ChildProcess | null = null;
  try {
    worker = spawn("node", ["--env-file=.env.local", "--import", "tsx", "worker/index.ts"], {
      cwd: process.cwd(),
      stdio: "ignore",
    });
    const deadline = Date.now() + 30_000;
    let delivered = false;
    while (Date.now() < deadline && !delivered) {
      const response = await page.request.get(`${MAILPIT}/api/v1/messages?limit=100`);
      const body = (await response.json()) as {
        messages: Array<{ To: Array<{ Address: string }> }>;
      };
      delivered = body.messages.some((message) =>
        message.To.some((to) => to.Address.toLowerCase() === address),
      );
      if (!delivered) await page.waitForTimeout(750);
    }
    expect(delivered, "email delivered after the worker returned").toBe(true);
  } finally {
    worker?.kill("SIGTERM");
    await page.waitForTimeout(500);
  }
});
