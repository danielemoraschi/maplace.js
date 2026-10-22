import { rfcBudgets } from "./checks/rfc-numbers.ts";
import { measureSizes, SIZE_MEASURES } from "./checks/sizes.ts";

const NAME_WIDTH = Math.max(...SIZE_MEASURES.map(({ name }) => name.length)) + 2;

const row = (...cells: string[]) =>
  cells.map((cell, i) => (i === 0 ? cell.padEnd(NAME_WIDTH) : cell.padStart(9))).join("");

/** `npm run sizes`: each budget, what it measures now, and how much room is left (gzip kB). */
async function printSizes(): Promise<void> {
  const budgets = rfcBudgets();
  console.log(row("gzip kB", "budget", "measured", "headroom"));
  for (const { measure, kilobytes } of await measureSizes()) {
    const budget = budgets.get(measure.rfcRow) ?? Number.NaN;
    console.log(
      row(measure.name, String(budget), kilobytes.toFixed(2), (budget - kilobytes).toFixed(2)),
    );
  }
}

await printSizes();
