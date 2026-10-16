import { rfcBudgets } from "./checks/rfc-numbers.ts";
import { measureSizes } from "./checks/sizes.ts";

const row = (...cells: string[]) =>
  cells.map((cell, i) => (i === 0 ? cell.padEnd(28) : cell.padStart(9))).join("");

/** `npm run sizes`: each budget, what it measures now, and how much room is left (gzip kB). */
function printSizes(): void {
  const budgets = rfcBudgets();
  console.log(row("gzip kB", "budget", "measured", "headroom"));
  for (const { measure, kilobytes } of measureSizes()) {
    const budget = budgets.get(measure.rfcRow) ?? Number.NaN;
    console.log(
      row(measure.name, String(budget), kilobytes.toFixed(2), (budget - kilobytes).toFixed(2)),
    );
  }
}

printSizes();
