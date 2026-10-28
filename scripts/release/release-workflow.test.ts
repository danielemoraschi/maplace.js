import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, it } from "vitest";
import { ROOT } from "../build/package.ts";

/** Holds the workflow, which can't run before R3, to the code and to its safety rules. */
const workflow = readFileSync(resolve(ROOT, ".github/workflows/release.yml"), "utf8");
const lines = workflow.split("\n");
const scripts = Object.keys(
  JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8")).scripts as object,
);

it("runs only the repo's own npm scripts", () => {
  const called = [...workflow.matchAll(/npm run (?:--silent )?([\w-]+)/g)].map(([, name]) => name);
  expect(called.length).toBeGreaterThan(0);
  for (const name of called) expect(scripts).toContain(name);
});

it("holds the release commit to every gate CI holds a push to", () => {
  const ci = readFileSync(resolve(ROOT, ".github/workflows/ci.yml"), "utf8");
  // The gates are verify's steps: the jobs after it deploy what passed.
  const verify = ci.split(/^ {2}(?=[\w-]+:$)/m).find((job) => job.startsWith("verify:")) ?? "";
  // CI's scan is report-only; the tests build the package for themselves, in temp dirs.
  const notGates = new Set(["npm run sonar", "npm run build"]);
  const gates = [...verify.matchAll(/^\s+(?:- )?run: (npm .+|npx .+)$/gm)].map(
    ([, step = ""]) => step,
  );
  expect(gates.length).toBeGreaterThan(3);
  for (const gate of gates.filter((step) => !notGates.has(step))) expect(workflow).toContain(gate);
});

it("reads the version input only into an environment variable, never inside a script", () => {
  const reading = lines.filter((line) => line.includes("inputs."));
  expect(reading.length).toBeGreaterThan(0);
  for (const line of reading) expect(line).toMatch(/^\s+VERSION: \$\{\{ inputs\.version \}\}$/);
});

it("keeps every checkout's credentials out of the suite and npm", () => {
  const checkouts = workflow.match(/uses: actions\/checkout@/g) ?? [];
  const withoutCredentials = workflow.match(/persist-credentials: false/g) ?? [];
  expect(checkouts.length).toBe(3);
  expect(withoutCredentials.length).toBe(checkouts.length);
});

it("lets npm publish through OIDC: no registry-url token placeholder, no shared cache", () => {
  expect(workflow).not.toMatch(/^\s+registry-url:/m);
  expect(workflow).not.toMatch(/^\s+cache:/m);
});

it("refuses a new version while the last one isn't on npm, before committing it", () => {
  const guard = workflow.indexOf('npm view "maplace@$LAST" version');
  expect(guard).toBeGreaterThan(-1);
  expect(guard).toBeLessThan(workflow.indexOf("commit -q -m"));
});
