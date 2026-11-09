import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ROOT } from "./build/package.ts";
import { jobNamed, stepsOf, stepWith } from "./checks/workflow-text.ts";

/**
 * Holds the site's production workflows (R4, W10c), which run only from main, to the preview's build,
 * to the site's own address, and to what a deploy may put live (R9, R10).
 */
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");
const deploy = read(".github/workflows/deploy.yml");
const offsite = read(".github/workflows/offsite.yml");
const ci = read(".github/workflows/ci.yml");
const SITE = /^\s+site: "([^"]+)",$/m.exec(read("apps/site/astro.config.ts"))?.[1] ?? "";
const OFFSITE_CHECK = `node apps/site/src/site/offsite-check.ts ${SITE}`;

/** The deploy's choice of release and commit (R9, R10), tested in scripts/release/deploy-target.test.ts. */
const DEPLOY_TARGET = 'node scripts/deploy-target.ts > "$RUNNER_TEMP/deploy-target.env" || {';

/** The two Node setups: main's, for the deploy-target script, then the deployed commit's, to build. */
const MAINS_NODE = "uses: actions/setup-node@";
const BUILDS_NODE = "cache: npm";

it("reads the site's address from its Astro config", () => {
  expect(SITE).toMatch(/^https:\/\/[\w.-]+$/);
});

describe("deploy.yml", () => {
  it("can be called by the release and dispatched by hand, reading contents and CI's runs only", () => {
    expect(deploy).toMatch(/^on:\n {2}workflow_dispatch:\n {2}workflow_call:\n/m);
    expect(deploy).toMatch(/^permissions:\n {2}contents: read\n {2}actions: read\n\n/m);
  });

  it("deploys only from main, before checking anything out", () => {
    expect(stepWith(deploy, 'test "$GITHUB_REF" = refs/heads/main')).toBe(0);
  });

  it("checks out main with its full history, for its release tags and the pages' dates", () => {
    const checkout = stepsOf(deploy)[stepWith(deploy, "uses: actions/checkout@")];
    expect(checkout).toContain("ref: main");
    expect(checkout).toContain("fetch-depth: 0");
    expect(checkout).toContain("persist-credentials: false");
  });

  it("deploys what main's deploy-target script picks, on main's Node, refusing when it refuses", () => {
    const pick = stepWith(deploy, DEPLOY_TARGET);
    const step = stepsOf(deploy)[pick] ?? "";
    expect(step).toMatch(/\|\| \{\n\s+echo "::error::[^"]+"\n\s+exit 1\n\s+\}/);
    expect(step).toContain('cat "$RUNNER_TEMP/deploy-target.env" >> "$GITHUB_ENV"');
    expect(step).toMatch(/GH_TOKEN: \$\{\{ github\.token \}\}/);
    const mainsNode = stepsOf(deploy).findIndex(
      (text) => text.includes(MAINS_NODE) && !text.includes(BUILDS_NODE),
    );
    const checkout = stepWith(deploy, 'git checkout --quiet "$DEPLOY_COMMIT"');
    expect(mainsNode).toBeGreaterThan(stepWith(deploy, "uses: actions/checkout@"));
    expect(mainsNode).toBeLessThan(pick);
    expect(checkout).toBe(pick + 1);
    for (const later of [BUILDS_NODE, "npm view", "run: npm ci"]) {
      expect(checkout).toBeLessThan(stepWith(deploy, later));
    }
  });

  it("refuses a tag that isn't its manifest's release, and names the release it deploys", () => {
    expect(stepsOf(deploy)[stepWith(deploy, "npm view")]).toMatch(
      /test "v\$version" = "\$RELEASE_TAG" \|\| \{[^}]*exit 1/,
    );
    expect(stepsOf(deploy)[stepWith(deploy, "wrangler@4.150.0 deploy")]).toContain(
      '--message "$RELEASE_TAG $(git rev-parse HEAD)"',
    );
  });

  it("checks the live site by main's rules, the newest, as offsite.yml does", () => {
    expect(stepsOf(deploy)[stepWith(deploy, OFFSITE_CHECK)]).toMatch(
      new RegExp(String.raw`git checkout --quiet main\n\s+${OFFSITE_CHECK.replaceAll(".", "\\.")}`),
    );
  });

  it("refuses a pre-release, or a version that isn't on npm, before installing or building", () => {
    const guard = stepWith(deploy, 'npm view "$name@$version" version');
    expect(stepsOf(deploy)[guard]).toMatch(/case "\$version" in\s+\*-\*\)[^\n]*exit 1/);
    expect(stepsOf(deploy)[guard]).toMatch(
      /test "\$\(npm view "\$name@\$version" version\)" = "\$version" \|\| \{[^}]*exit 1/,
    );
    expect(guard).toBeLessThan(stepWith(deploy, "run: npm ci"));
  });

  it("builds the site with the preview's own build step", () => {
    const preview = jobNamed("deploy-preview", ci);
    const build = stepsOf(preview)[stepWith(preview, "npm run site:build")];
    expect(stepsOf(deploy)[stepWith(deploy, "npm run site:build")]).toBe(build);
  });

  it("adds no noindex header", () => {
    expect(deploy).not.toContain("X-Robots-Tag");
  });

  it("fetches Wrangler before the Cloudflare token is in the environment", () => {
    const deploying = stepWith(deploy, "CLOUDFLARE_API_TOKEN");
    expect(stepsOf(deploy)[deploying]).toContain("wrangler@4.150.0 deploy");
    expect(stepWith(deploy, "wrangler@4.150.0 --version")).toBeLessThan(deploying);
  });

  it("checks the site's own address for offsite requests after deploying", () => {
    expect(stepWith(deploy, OFFSITE_CHECK)).toBeGreaterThan(
      stepWith(deploy, "wrangler@4.150.0 deploy"),
    );
  });
});

describe("offsite.yml", () => {
  it("checks the site on the 1st and 15th, and by hand", () => {
    expect(offsite).toMatch(/^\s+- cron: "\d+ \d+ 1,15 \* \*"$/m);
    expect(offsite).toMatch(/^\s+workflow_dispatch:$/m);
  });

  it("checks the live security.txt has a month left, after the offsite check", () => {
    const expiry = stepWith(offsite, `node scripts/security-txt-expiry.ts ${SITE}`);
    expect(expiry).toBeGreaterThan(stepWith(offsite, OFFSITE_CHECK));
    expect(stepsOf(offsite)[expiry], "run whatever the offsite check found").toContain(
      "if: ${{ !cancelled() }}",
    );
  });

  it("runs the check on Node alone, with no install", () => {
    expect(stepsOf(offsite).filter((step) => step.includes(OFFSITE_CHECK))).toHaveLength(1);
    expect(offsite).not.toMatch(/npm (ci|install)/);
  });
});
