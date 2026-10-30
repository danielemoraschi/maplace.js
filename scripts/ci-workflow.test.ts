import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, it } from "vitest";
import { ROOT } from "./build/package.ts";

/**
 * Holds CI's Chromium install to its package cache (T23): Ubuntu's mirror has been slow enough
 * for Chromium's system packages to run out the job's time on their own.
 */
const workflow = readFileSync(resolve(ROOT, ".github/workflows/ci.yml"), "utf8");
const steps = workflow.split(/\n(?= {6}- )/);

/** Where apt keeps the packages between runs. */
const PACKAGES = "~/.cache/chromium-packages";

/** The position of the one step that has every one of `parts`. */
function stepWith(...parts: string[]): number {
  const found = steps.flatMap((step, index) =>
    parts.every((part) => step.includes(part)) ? [index] : [],
  );
  expect(found, parts.join(" + ")).toHaveLength(1);
  return found[0] ?? -1;
}

it("installs Chromium's system packages from apt's archive, restored before and kept after", () => {
  const restored = stepWith("uses: actions/cache/restore@", `path: ${PACKAGES}`);
  const aptPointed = stepWith("Dir::Cache::Archives", PACKAGES.replace("~", "$HOME"));
  const installed = stepWith("playwright install --with-deps");
  const saved = stepWith("uses: actions/cache/save@", `path: ${PACKAGES}`);
  expect([restored, aptPointed, installed, saved]).toEqual(
    [restored, aptPointed, installed, saved].toSorted((a, b) => a - b),
  );
});

it("keeps the packages before the tests run, so a run they cut short has warmed the cache", () => {
  expect(stepWith("uses: actions/cache/save@", `path: ${PACKAGES}`)).toBeLessThan(
    stepWith("run: npm test"),
  );
});

it("gives every job that builds the site its full history, or every page is dated at the last commit", () => {
  const jobs = workflow.split(/^ {2}(?=[\w-]+:$)/m);
  const buildingTheSite = jobs.filter((job) => job.includes("npm run site:build"));
  expect(buildingTheSite.length).toBeGreaterThan(0);
  for (const job of buildingTheSite) expect(job).toContain("fetch-depth: 0");
});
