import * as changelog from "./checks/changelog.ts";
import * as docLinks from "./checks/doc-links.ts";
import * as docSnippets from "./checks/doc-snippets.ts";
import * as gluedExpressions from "./checks/glued-expressions.ts";
import * as imports from "./checks/imports.ts";
import * as migrationEvents from "./checks/migration-events.ts";
import * as rfc from "./checks/rfc.ts";
import * as sizes from "./checks/sizes.ts";
import * as workflows from "./checks/workflows.ts";

/** Repo checks run by `npm run check` after Biome; each returns its problems. */
const CHECKS: Readonly<Record<string, () => string[] | Promise<string[]>>> = {
  "import layers": imports.check,
  "RFC ↔ types": rfc.check,
  "MIGRATION ↔ events": migrationEvents.check,
  "size budgets": sizes.check,
  CHANGELOG: changelog.check,
  "doc links": docLinks.check,
  "doc snippets": docSnippets.check,
  "glued expressions": gluedExpressions.check,
  workflows: workflows.check,
};

const reports = await Promise.all(
  Object.entries(CHECKS).map(async ([name, check]) =>
    (await check()).map((problem) => `${name}: ${problem}`),
  ),
);
const problems = reports.flat();
for (const problem of problems) console.error(problem);
if (problems.length > 0) process.exitCode = 1;
else console.log(`Repo checks passed: ${Object.keys(CHECKS).join(", ")}.`);
