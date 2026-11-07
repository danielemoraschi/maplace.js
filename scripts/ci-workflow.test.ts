import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, it } from "vitest";
import { ROOT } from "./build/package.ts";
import { jobsOf, stepWith } from "./checks/workflow-text.ts";

/**
 * Holds CI's Chromium install to its package cache (T23): Ubuntu's mirror has been slow enough
 * for Chromium's system packages to run out the job's time on their own.
 */
const workflow = readFileSync(resolve(ROOT, ".github/workflows/ci.yml"), "utf8");

/** Where apt keeps the packages between runs. */
const PACKAGES = "~/.cache/chromium-packages";

it("installs Chromium's system packages from apt's archive, restored before and kept after", () => {
  const restored = stepWith(workflow, "uses: actions/cache/restore@", `path: ${PACKAGES}`);
  const aptPointed = stepWith(workflow, "Dir::Cache::Archives", PACKAGES.replace("~", "$HOME"));
  const installed = stepWith(workflow, "playwright install --with-deps");
  const saved = stepWith(workflow, "uses: actions/cache/save@", `path: ${PACKAGES}`);
  expect([restored, aptPointed, installed, saved]).toEqual(
    [restored, aptPointed, installed, saved].toSorted((a, b) => a - b),
  );
});

it("keeps the packages before the tests run, so a run they cut short has warmed the cache", () => {
  expect(stepWith(workflow, "uses: actions/cache/save@", `path: ${PACKAGES}`)).toBeLessThan(
    stepWith(workflow, "run: npm test"),
  );
});

it("gives every job that builds the site its full history, or every page is dated at the last commit", () => {
  const buildingTheSite = jobsOf(workflow).filter((job) => job.includes("npm run site:build"));
  expect(buildingTheSite.length).toBeGreaterThan(0);
  for (const job of buildingTheSite) expect(job).toContain("fetch-depth: 0");
});
