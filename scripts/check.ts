import * as imports from "./checks/imports.ts";
import * as rfc from "./checks/rfc.ts";
import * as sizes from "./checks/sizes.ts";

/** Repo checks run by `npm run check` after Biome; each returns its problems. */
const CHECKS: Readonly<Record<string, () => string[]>> = {
  "import layers": imports.check,
  "RFC ↔ types": rfc.check,
  "size budgets": sizes.check,
};

const problems = Object.entries(CHECKS).flatMap(([name, check]) =>
  check().map((problem) => `${name}: ${problem}`),
);
for (const problem of problems) console.error(problem);
if (problems.length > 0) process.exitCode = 1;
else console.log(`Repo checks passed: ${Object.keys(CHECKS).join(", ")}.`);
