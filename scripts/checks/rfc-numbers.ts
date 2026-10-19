import { readFileSync } from "node:fs";
import { section } from "../docs/markdown.ts";
import { RFC } from "./rfc.ts";

// A budget row of the Numbers table, e.g. | Core (`maplace`) | ≤ 15.5 kB |.
const BUDGET_ROW = /^\| (.+?) \| ≤ ([\d.]+) kB \|$/gm;

/** The size budgets RFC §3 Numbers sets, by row: the one place they are written. */
export function rfcBudgets(): Map<string, number> {
  return budgetsInRfc(readFileSync(RFC, "utf8"));
}

/** Each budget row of the Numbers table: its first cell, and its kB. */
export function budgetsInRfc(markdown: string): Map<string, number> {
  const rows = section(markdown, "### Numbers", RFC).matchAll(BUDGET_ROW);
  return new Map(Array.from(rows, ([, row, kilobytes]) => [row ?? "", Number(kilobytes)]));
}

/** The least share of lines the tests must cover, in %: the core entry's, and the package's. */
export interface CoverageFloors {
  readonly core: number;
  readonly package: number;
}

// The Numbers section's coverage line, e.g. Test coverage: core ≥ 95% of lines, whole package ≥ 85%.
const COVERAGE_LINE = /^Test coverage: core ≥ ([\d.]+)% of lines, whole package ≥ ([\d.]+)%\.$/m;

/** The coverage floors RFC §3 Numbers sets: the one place they are written. */
export function rfcCoverageFloors(): CoverageFloors {
  return coverageFloorsInRfc(readFileSync(RFC, "utf8"));
}

/** The coverage line of the Numbers section, read; a line not in its format throws. */
export function coverageFloorsInRfc(markdown: string): CoverageFloors {
  const floors = COVERAGE_LINE.exec(section(markdown, "### Numbers", RFC));
  if (floors === null)
    throw new Error(`${RFC} §3 Numbers has no coverage floors in the format read`);
  return { core: Number(floors[1]), package: Number(floors[2]) };
}
