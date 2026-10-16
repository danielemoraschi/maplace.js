import { readFileSync } from "node:fs";
import { RFC, section } from "./rfc.ts";

// A budget row of the Numbers table, e.g. | Core (`maplace`) | ≤ 15.5 kB |.
const BUDGET_ROW = /^\| (.+?) \| ≤ ([\d.]+) kB \|$/gm;

/** The size budgets RFC §3 Numbers sets, by row: the one place they are written. */
export function rfcBudgets(): Map<string, number> {
  return budgetsInRfc(readFileSync(RFC, "utf8"));
}

/** Each budget row of the Numbers table: its first cell, and its kB. */
export function budgetsInRfc(markdown: string): Map<string, number> {
  const rows = section(markdown, "### Numbers").matchAll(BUDGET_ROW);
  return new Map(Array.from(rows, ([, row, kilobytes]) => [row ?? "", Number(kilobytes)]));
}
