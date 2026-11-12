import { spawnSync } from "node:child_process";

/**
 * Runs `prisma generate` after a normal install so a fresh clone can seed/build without an extra
 * manual step (P13-T03). Container dependency stages set SKIP_PRISMA_GENERATE=1 because they copy
 * only the lockfile; the builder image runs the generator after the schema is present.
 */
if (process.env.SKIP_PRISMA_GENERATE === "1") {
  process.exit(0);
}

const result = spawnSync("prisma", ["generate"], { stdio: "inherit", shell: true });
process.exit(result.status ?? 1);
