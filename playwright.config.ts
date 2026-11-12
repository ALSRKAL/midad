import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end configuration (docs/TEST_PLAN.md §3–§4).
 *
 * - Served on port 3100 so it never collides with a developer's `pnpm dev` on 3000.
 * - Trace on first retry, video on failure: a flaky failure must be diagnosable from CI artifacts.
 * - Desktop + one mobile profile from the start; the full browser matrix is P12-T02.
 */
export default defineConfig({
  testDir: ".",
  testMatch: [
    "tests/e2e/**/*.spec.ts",
    "tests/a11y/**/*.spec.ts",
    "tests/journeys/**/*.spec.ts",
    "tests/chaos/**/*.spec.ts",
    "tests/e2e-rate-limit/**/*.spec.ts",
  ],
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  // Zero-flaky gate (the product requirements, P15-T01): a retry would hide an intermittent failure, so even CI
  // runs exactly once. Failures keep their trace/video instead of disappearing into a retry.
  retries: 0,
  /**
   * One worker on this development host. The suite runs a production Next server, the HLS worker,
   * Postgres/Redis/MinIO/Mailpit containers and Chromium from one 16 GB machine; two workers left
   * ~1.6 GB free and 6.8 GB of swap in use, and legitimate register → verify → sign-in journeys
   * stalled past 60s even though each takes ~16s in isolation. One worker keeps the browser judge
   * honest about the application instead of measuring host memory pressure. CI runs two when the
   * runner is provisioned for it.
   */
  workers: process.env.CI ? 2 : 1,
  // Full journeys (application → build → review) exceed one minute by design. This host also runs
  // unrelated builds, and a page-level axe pass can take minutes under load; the timeout only
  // bounds failure recovery, it does not relax any assertion.
  timeout: 420_000,
  expect: { timeout: 20_000 },
  reporter: process.env.CI ? [["list"], ["github"]] : [["list"]],
  use: {
    baseURL: "http://127.0.0.1:3100",
    // With retries at zero, a failure's trace must still exist for root-cause analysis.
    trace: "retain-on-failure",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
    locale: "ar-SA",
    timezoneId: "Asia/Riyadh",
  },
  projects: [
    {
      name: "desktop-chromium",
      testIgnore: ["tests/e2e-rate-limit/**", "tests/a11y/audit-mobile.spec.ts", "tests/chaos/**"],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chromium",
      // The desktop interaction/keyboard audits stay on desktop; the mobile axe audit replaces them
      // with the same route list on a phone viewport (P14-T02).
      testIgnore: [
        "tests/e2e-rate-limit/**",
        "tests/e2e/audit/**",
        "tests/e2e/admin-keyboard.spec.ts",
        "tests/chaos/**",
      ],
      use: { ...devices["Pixel 7"] },
    },
    {
      // The limiter suite runs alone against the low-ceiling server on 3101: its whole point is to
      // exhaust a bucket, which must never happen to the functional suite on 3100.
      name: "rate-limit",
      testMatch: "tests/e2e-rate-limit/**/*.spec.ts",
      fullyParallel: false,
      use: { ...devices["Desktop Chrome"], baseURL: "http://127.0.0.1:3101" },
    },
    {
      // The eleven §13.3 journeys run on every engine; all their data comes from the fixture API,
      // so Gecko/WebKit never share a mutable row with Chromium (P14-T01).
      name: "firefox",
      testMatch: ["tests/journeys/**/*.spec.ts", "tests/e2e/cross-browser.spec.ts"],
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      testMatch: ["tests/journeys/**/*.spec.ts", "tests/e2e/cross-browser.spec.ts"],
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "mobile-safari",
      testMatch: [
        "tests/journeys/**/*.spec.ts",
        "tests/e2e/cross-browser.spec.ts",
        "tests/a11y/audit-mobile.spec.ts",
      ],
      use: { ...devices["iPhone 14"] },
    },
    {
      // Chaos cases stop and restart the shared services; they must never run beside another
      // project. One worker, serial files, desktop Chromium (network emulation is CDP-based).
      name: "chaos",
      testMatch: "tests/chaos/**/*.spec.ts",
      fullyParallel: false,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "visual",
      testMatch: "tests/visual/**/*.spec.ts",
      fullyParallel: false,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    // A production build, not `next dev`: the E2E suite must exercise what users get, and the
    // dev-only HMR WebSocket would otherwise pollute the "zero console errors" assertion.
    // The script builds once and starts both servers (see scripts/e2e-servers.sh).
    command: "sh scripts/e2e-servers.sh",
    url: "http://127.0.0.1:3100",
    // Never reuse a running server on this port: during P01-T05 a stale server served the
    // previous build's asset map, so CSS and fonts 404'd and the suite reported real-looking
    // failures against code it was not testing. Starting our own is slower but honest.
    reuseExistingServer: false,
    timeout: 300_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
