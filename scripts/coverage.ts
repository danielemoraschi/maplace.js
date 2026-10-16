import { existsSync, readFileSync } from "node:fs";
import { type CoverageSummary, check, coreSourceFiles, coverageReport } from "./checks/coverage.ts";
import { rfcCoverageFloors } from "./checks/rfc-numbers.ts";

const SUMMARY = "coverage/coverage-summary.json";

/** `npm run coverage`: the last `npm test`'s line coverage against RFC §3's floors. */
async function checkCoverage(): Promise<void> {
  if (!existsSync(SUMMARY)) {
    console.error(`no ${SUMMARY}: run npm test first`);
    process.exitCode = 1;
    return;
  }
  const summary = JSON.parse(readFileSync(SUMMARY, "utf8")) as CoverageSummary;
  const floors = rfcCoverageFloors();
  const report = coverageReport(summary, await coreSourceFiles());
  for (const share of ["core", "package"] as const) {
    console.log(`${share}: ${report.shares[share].toFixed(2)}% of lines (floor ${floors[share]}%)`);
  }
  const problems = check(report, floors);
  for (const problem of problems) console.error(problem);
  if (problems.length > 0) process.exitCode = 1;
}

await checkCoverage();
