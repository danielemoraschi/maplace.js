import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { commitAll, testGit as git, newTestRepo } from "../build/test-repo.ts";
import { check } from "./changelog.ts";

function commit(repo: string, message: string, changelog?: string): void {
  if (changelog !== undefined) writeFileSync(join(repo, "CHANGELOG.md"), changelog);
  commitAll(repo, message);
}

function newRepo(): string {
  const repo = newTestRepo("changelog");
  commit(repo, "[add] before the changelog, fixes #1");
  return repo;
}

describe("the CHANGELOG check", () => {
  it("checks nothing before CHANGELOG.md exists", () => {
    expect(check(newRepo())).toEqual([]);
  });

  it("ignores closing commits before the one that creates CHANGELOG.md", () => {
    const repo = newRepo();
    commit(repo, "[add] P4: CHANGELOG.md", "# Changelog\n\n- 2026-10-16 Changed everything\n");
    expect(check(repo)).toEqual([]);
  });

  it("passes a closing commit whose issue a line names, and names one that isn't", () => {
    const repo = newRepo();
    commit(
      repo,
      "[add] P4: CHANGELOG.md",
      "# Changelog\n\n## 0.2.10 (2017-04-02)\n\n- 2017-04-02 Fixed old #9\n",
    );
    commit(
      repo,
      "[fix] the list\n\nFixes #12",
      "# Changelog\n\n- 2026-10-20 Fixed the list #12\n\n## 0.2.10 (2017-04-02)\n\n- 2017-04-02 Fixed old #9\n",
    );
    commit(repo, "[fix] again: closes #9 and resolves #13");
    const sha = git(repo, "rev-parse", "--short", "HEAD").trim();
    expect(check(repo)).toEqual([`${sha} closes #13, which no line of CHANGELOG.md names`]);
  });

  it("still counts a line a release has since put under its heading", () => {
    const repo = newRepo();
    commit(repo, "[add] P4: CHANGELOG.md", "# Changelog\n\n- 2026-10-16 Changed everything\n");
    commit(repo, "[fix] the list, fixes #12", "# Changelog\n\n- 2026-10-20 Fixed the list #12\n");
    commit(
      repo,
      "[upd] release 1.0.1",
      "# Changelog\n\n## 1.0.1 (2026-10-21)\n\n- 2026-10-20 Fixed the list #12\n",
    );
    expect(check(repo)).toEqual([]);
  });

  it("names a line without its date and verb", () => {
    const repo = newRepo();
    commit(repo, "[add] P4: CHANGELOG.md", "# Changelog\n\n- Changed everything\n");
    expect(check(repo)).toEqual([
      "CHANGELOG.md line 3: - Changed everything doesn't open `- YYYY-MM-DD Added/Changed/Fixed/Removed`",
    ]);
  });
});
