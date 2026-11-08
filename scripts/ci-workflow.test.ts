import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, it } from "vitest";
import { ROOT } from "./build/package.ts";
import { jobsOf, stepsOf, stepWith } from "./checks/workflow-text.ts";

/**
 * Holds CI to its rules: Chromium's install to its package cache (T23: Ubuntu's mirror has been
 * slow enough to run out the job's time), the site's builds to their full history, and what runs
 * only on main (R8: the billed tests, Sonar, the preview) to main, where work merges.
 */
const workflow = readFileSync(resolve(ROOT, ".github/workflows/ci.yml"), "utf8");

/** The branch CI runs its billed tests, Sonar and the preview on. */
const MAIN = "main";

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

it("runs the billed tests, Sonar and the preview on main alone", () => {
  const gated = [...workflow.matchAll(/github\.ref == 'refs\/heads\/([^']+)'/g)].map(
    ([, branch]) => branch,
  );
  expect(gated.length).toBeGreaterThanOrEqual(4);
  expect(new Set(gated)).toEqual(new Set([MAIN]));
  expect(/--branch (\S+)/.exec(stepHaving("gh run list"))?.[1]).toBe(MAIN);
});

it("checks the preview at the alias it uploads, main's", () => {
  const alias = /--preview-alias (\S+)/.exec(stepHaving("--preview-alias"))?.[1];
  expect(alias).toBe(MAIN);
  expect(stepHaving("offsite-check.ts")).toContain(`offsite-check.ts https://${alias}-maplacejs.`);
});

/** The text of the one step of CI that has `part`. */
function stepHaving(part: string): string {
  return stepsOf(workflow)[stepWith(workflow, part)] ?? "";
}
