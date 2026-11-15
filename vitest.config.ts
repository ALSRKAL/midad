import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * Unit / integration test configuration (docs/TEST_PLAN.md §1).
 *
 * Coverage thresholds are enforced, not reported: 90% on the business layer, and the
 * per-rule coverage of BR-01…BR-21 is asserted separately by the rule-inventory test.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // `server-only` throws unless the Next server runtime loaded it; tests import services
      // directly, so it is stubbed. The guard stays active in the real app build.
      "server-only": fileURLToPath(new URL("./tests/stubs/server-only.ts", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: false,
    setupFiles: ["tests/setup.ts"],
    include: ["tests/unit/**/*.test.{ts,tsx}", "tests/integration/**/*.test.{ts,tsx}"],
    restoreMocks: true,
    // Integration suites talk to a real database and generate PDFs; the 5s default is too tight
    // on shared CI runners.
    testTimeout: 30_000,
    hookTimeout: 30_000,
    reporters: process.env.CI ? ["default", "github-actions"] : ["default"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      reportsDirectory: "coverage",
      include: ["src/features/**/services.ts", "src/lib/**/*.ts", "src/config/**/*.ts"],
      thresholds: {
        lines: 90,
        functions: 90,
        statements: 90,
        branches: 85,
      },
    },
  },
});
