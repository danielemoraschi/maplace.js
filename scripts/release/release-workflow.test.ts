import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, it } from "vitest";
import { parse } from "yaml";
import { ROOT } from "../build/package.ts";
import { jobNamed } from "../checks/workflow-text.ts";
import { CDN_DEADLINE_MS, LONGEST_CDN_ATTEMPT_MS } from "./cdn-check.ts";

/** Holds the workflow, which can't run before R3, to the code and to its safety rules. */
const workflow = readFileSync(resolve(ROOT, ".github/workflows/release.yml"), "utf8");
const lines = workflow.split("\n");
const scripts = Object.keys(
  JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8")).scripts as object,
);

const CDN_CHECK = "run: npm run --silent release-cdn";

it("runs only the repo's own npm scripts", () => {
  const called = [...workflow.matchAll(/npm run (?:--silent )?([\w-]+)/g)].map(([, name]) => name);
  expect(called.length).toBeGreaterThan(0);
  for (const name of called) expect(scripts).toContain(name);
});

it("holds the release commit to every gate CI holds a push to", () => {
  const ci = readFileSync(resolve(ROOT, ".github/workflows/ci.yml"), "utf8");
  // The gates are verify's steps: the jobs after it deploy what passed.
  const verify = jobNamed("verify", ci);
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
  const guard = workflow.indexOf('npm view "@maplacejs/maplace@$LAST" version');
  expect(guard).toBeGreaterThan(-1);
  expect(guard).toBeLessThan(workflow.indexOf("commit -q -m"));
});

it("checks the CDN before making the GitHub release", () => {
  const announce = jobNamed("announce", workflow);
  expect(announce.indexOf(CDN_CHECK)).toBeGreaterThan(-1);
  expect(announce.indexOf(CDN_CHECK)).toBeLessThan(announce.indexOf("gh release create"));
});

it("gives the CDN check no token", () => {
  const announce = jobNamed("announce", workflow);
  const [beforeCheck = "", afterCheck = ""] = announce.split(CDN_CHECK);
  expect(workflow.slice(0, workflow.indexOf("\njobs:"))).not.toContain("GH_TOKEN");
  expect(beforeCheck).not.toContain("GH_TOKEN");
  expect(afterCheck).toContain("GH_TOKEN");
});

it("leaves the CDN check's retries room inside announce's timeout", () => {
  const minutes = Number(/timeout-minutes: (\d+)/.exec(jobNamed("announce", workflow))?.[1]);
  expect(minutes * 60_000).toBeGreaterThan(CDN_DEADLINE_MS + LONGEST_CDN_ATTEMPT_MS);
});

it("builds what it publishes from the lockfile", () => {
  const publish = jobNamed("publish", workflow);
  expect(publish.indexOf("npm ci")).toBeGreaterThan(-1);
  expect(publish.indexOf("npm ci")).toBeLessThan(publish.indexOf("npm run build"));
});

it("deploys the site after announce, through the deploy workflow", () => {
  const deploy = jobNamed("deploy", workflow);
  expect(deploy).toMatch(/^\s+needs: \[release, announce\]$/m);
  expect(deploy).toMatch(/^\s+uses: \.\/\.github\/workflows\/deploy\.yml$/m);
  // Without them the deploy fails, and only after an irreversible publish.
  expect(deploy).toMatch(/^\s+secrets: inherit$/m);
});

it("grants the deploy every permission the deploy workflow asks for, or it can't start", () => {
  const asked = parse(
    readFileSync(resolve(ROOT, ".github/workflows/deploy.yml"), "utf8"),
  ).permissions;
  expect(Object.keys(asked).length).toBeGreaterThan(0);
  expect(parse(workflow).jobs.deploy.permissions).toMatchObject(asked);
});

it("never deploys a pre-release", () => {
  expect(jobNamed("deploy", workflow)).toMatch(
    /^\s+if: needs\.release\.outputs\.prerelease != 'true'$/m,
  );
});
