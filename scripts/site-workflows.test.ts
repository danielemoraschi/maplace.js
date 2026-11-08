import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ROOT } from "./build/package.ts";
import { jobNamed, stepsOf, stepWith } from "./checks/workflow-text.ts";

/**
 * Holds the site's production workflows (R4, W10c), which run only from main, to the preview's build
 * and to the site's own address.
 */
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");
const deploy = read(".github/workflows/deploy.yml");
const offsite = read(".github/workflows/offsite.yml");
const ci = read(".github/workflows/ci.yml");
const SITE = /^\s+site: "([^"]+)",$/m.exec(read("apps/site/astro.config.ts"))?.[1] ?? "";
const OFFSITE_CHECK = `node apps/site/src/site/offsite-check.ts ${SITE}`;

it("reads the site's address from its Astro config", () => {
  expect(SITE).toMatch(/^https:\/\/[\w.-]+$/);
});

describe("deploy.yml", () => {
  it("can be called by the release and dispatched by hand, reading contents only", () => {
    expect(deploy).toMatch(/^on:\n {2}workflow_dispatch:\n {2}workflow_call:\n/m);
    expect(deploy).toMatch(/^permissions:\n {2}contents: read\n\n/m);
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

  it("deploys the newest stable release tag on main, before setting up Node", () => {
    const pick = stepWith(deploy, "git tag --list 'v[0-9]*'");
    const step = stepsOf(deploy)[pick];
    expect(step).toContain("--sort=-v:refname");
    expect(step).toContain("grep -v -- -");
    expect(step).toMatch(/git merge-base --is-ancestor "\$tag" origin\/main \|\| \{[^}]*exit 1/);
    expect(step).toContain('git checkout --quiet "$tag"');
    expect(step).toContain('echo "RELEASE_TAG=$tag" >> "$GITHUB_ENV"');
    expect(pick).toBeGreaterThan(stepWith(deploy, "uses: actions/checkout@"));
    for (const later of ["uses: actions/setup-node@", "npm view", "run: npm ci"]) {
      expect(pick).toBeLessThan(stepWith(deploy, later));
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

  it("runs the check on Node alone, with no install", () => {
    expect(stepsOf(offsite).filter((step) => step.includes(OFFSITE_CHECK))).toHaveLength(1);
    expect(offsite).not.toMatch(/npm (ci|install)/);
  });
});
