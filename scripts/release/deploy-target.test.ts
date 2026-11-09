import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { REPO_DOCS } from "../../apps/site/src/site/repo-docs.ts";
import { PACKAGE_DIR } from "../build/package.ts";
import { commitAll, newTestRepo, testGit } from "../build/test-repo.ts";
import { CHANGELOG_FILE } from "../docs/changelog-lines.ts";
import { deployTarget, readerFacingPaths, verifiedDeployTarget } from "./deploy-target.ts";
import { fakeGh } from "./fake-gh.ts";

/** A repo of its own per test: a release `v1.0.0` on `main`, then what each test commits. */
let repo = "";
const git = (args: readonly string[]) => testGit(repo, ...args);
const commitOf = (revision: string) => git(["rev-parse", revision]).trim();
const tag = (name: string) => git(["tag", "--annotate", name, "--message", name]);

/** Commits a change to `file` on the branch checked out, returning the commit. */
function commitChange(file: string): string {
  const path = join(repo, file);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${file} at ${Date.now()} ${Math.random()}\n`);
  commitAll(repo, `change ${file}`);
  return commitOf("HEAD");
}

beforeEach(() => {
  repo = newTestRepo("deploy-target");
  git(["switch", "--quiet", "--create", "main"]);
  commitChange("README.md");
  tag("v1.0.0");
});

describe("deployTarget", () => {
  it("deploys the release when main is still it", () => {
    expect(deployTarget(git, "main")).toEqual({
      tag: "v1.0.0",
      commit: commitOf("v1.0.0^{commit}"),
      isRelease: true,
    });
  });

  it("deploys main's head when only the site changed since the release", () => {
    commitChange("apps/site/public/_redirects");
    const head = commitChange(".github/workflows/deploy.yml");
    expect(deployTarget(git, "main")).toEqual({ tag: "v1.0.0", commit: head, isRelease: false });
  });

  it("stops before the first change a reader of the library sees, holding later site changes back", () => {
    const site = commitChange("apps/site/src/pages/builder.astro");
    const docs = commitChange("docs/reference/api.md");
    commitChange("apps/site/public/robots.txt");
    expect(deployTarget(git, "main")).toEqual({
      tag: "v1.0.0",
      commit: site,
      isRelease: false,
      heldBackBy: docs,
    });
  });

  it("deploys the release itself when the library changed right after it", () => {
    const library = commitChange(`${PACKAGE_DIR}/src/store.ts`);
    commitChange("apps/site/public/robots.txt");
    expect(deployTarget(git, "main")).toEqual({
      tag: "v1.0.0",
      commit: commitOf("v1.0.0^{commit}"),
      isRelease: true,
      heldBackBy: library,
    });
  });

  it("counts the CHANGELOG, MIGRATION and the README as the library's", () => {
    for (const file of [CHANGELOG_FILE, "MIGRATION.md", "README.md"]) {
      const before = commitOf("HEAD");
      const change = commitChange(file);
      expect(deployTarget(git, "main"), file).toMatchObject({ heldBackBy: change });
      git(["reset", "--quiet", "--hard", before]);
    }
  });

  it("holds to the newest stable release by version, never a pre-release or a stray tag", () => {
    commitChange("apps/site/public/robots.txt");
    tag("v1.10.0");
    tag("v1.9.0");
    commitChange(`${PACKAGE_DIR}/src/store.ts`);
    tag("v1.11.0-beta.1");
    tag("v9x");
    expect(deployTarget(git, "main")).toMatchObject({ tag: "v1.10.0", isRelease: true });
  });

  it("refuses a release that isn't on main, as tags aren't protected", () => {
    git(["switch", "--quiet", "--create", "elsewhere"]);
    commitChange("README.md");
    tag("v2.0.0");
    git(["switch", "--quiet", "main"]);
    expect(() => deployTarget(git, "main")).toThrow("v2.0.0 isn't on main");
  });

  it("refuses, deploying nothing, with no release at all", () => {
    git(["tag", "--delete", "v1.0.0"]);
    expect(() => deployTarget(git, "main")).toThrow("no release tag to deploy");
  });
});

describe("verifiedDeployTarget", () => {
  it("deploys the release without asking CI, its gates being the release's", () => {
    const { gh, calls } = fakeGh([], {});
    expect(verifiedDeployTarget(git, gh, "owner/repo", "main")).toMatchObject({ isRelease: true });
    expect(calls).toEqual([]);
  });

  it("deploys main's site changes once CI's verify passed on that commit", () => {
    const head = commitChange("apps/site/public/_redirects");
    const { gh, calls } = fakeGh(["7"], { "7": true });
    expect(verifiedDeployTarget(git, gh, "owner/repo", "main")).toMatchObject({ commit: head });
    expect(calls[0]?.join(" ")).toContain(`--commit ${head}`);
  });

  it("refuses main's site changes while CI's verify hasn't passed on them", () => {
    const head = commitChange("apps/site/public/_redirects");
    const { gh } = fakeGh(["7"], { "7": false });
    expect(() => verifiedDeployTarget(git, gh, "owner/repo", "main")).toThrow(
      `CI's verify hasn't passed on ${head}`,
    );
  });
});

describe("readerFacingPaths", () => {
  it("are the package and every repo document the site renders, none of the site's own", () => {
    const paths = readerFacingPaths();
    expect(paths).toContain(PACKAGE_DIR);
    expect(paths.filter((path) => path.startsWith(`${PACKAGE_DIR}/`))).toEqual([]);
    expect(paths).toEqual(expect.arrayContaining(REPO_DOCS.map(({ file }) => file)));
    expect(paths).toContain(CHANGELOG_FILE);
    expect(paths.filter((path) => path.startsWith("apps/site/"))).toEqual([]);
  });
});
