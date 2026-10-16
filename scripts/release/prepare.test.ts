import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { commitAll, newTestRepo, testGit } from "../build/test-repo.ts";
import { prepareRelease } from "./prepare.ts";
import { VERSION_FILES } from "./version-files.ts";

const CHANGELOG = [
  "# Changelog",
  "",
  "- 2026-10-20 Added a thing",
  "",
  "## 1.0.0 (2026-10-16)",
  "",
  "- 2026-10-16 Changed everything",
  "",
].join("\n");

/** Each version file as small as its pattern allows (version-files.test.ts holds the real ones). */
const AT_1_0_0: Readonly<Record<string, string>> = {
  "packages/maplace/package.json": '{\n  "name": "maplace",\n  "version": "1.0.0"\n}\n',
  "package-lock.json":
    '{\n  "packages": {\n    "packages/maplace": {\n      "version": "1.0.0"\n    }\n  }\n}\n',
  "packages/maplace/src/element/version.ts": 'export const MAPLACE_VERSION = "1.0.0";\n',
};

/** A repo with the version files and `CHANGELOG`, released as 1.0.0. */
function releasedRepo(): string {
  const repo = newTestRepo("prepare");
  for (const { path } of VERSION_FILES) {
    mkdirSync(dirname(join(repo, path)), { recursive: true });
    writeFileSync(join(repo, path), AT_1_0_0[path] ?? "");
  }
  writeFileSync(join(repo, "CHANGELOG.md"), CHANGELOG);
  commitAll(repo, "[add] the package");
  testGit(repo, "tag", "v1.0.0");
  return repo;
}

function contents(repo: string): string[] {
  return ["CHANGELOG.md", ...VERSION_FILES.map(({ path }) => path)].map((path) =>
    readFileSync(join(repo, path), "utf8"),
  );
}

describe("prepareRelease", () => {
  it("writes the version and the changelog's heading, and names the files it wrote", () => {
    const repo = releasedRepo();
    const prepared = prepareRelease(repo, { version: "1.1.0", date: "2026-10-21" });
    expect(prepared).toMatchObject({ tag: "v1.1.0", distTag: "latest", lastReleased: "1.0.0" });
    expect(new Set(prepared.written)).toEqual(
      new Set(["CHANGELOG.md", ...VERSION_FILES.map(({ path }) => path)]),
    );
    expect(testGit(repo, "status", "--porcelain").trim().split("\n")).toHaveLength(4);
    const [changelog, ...versionFiles] = contents(repo);
    expect(changelog).toContain("# Changelog\n\n## 1.1.0 (2026-10-21)\n\n- 2026-10-20 Added");
    for (const text of versionFiles) expect(text).toContain('"1.1.0"');
  });

  it("writes nothing when the release is refused", () => {
    const repo = releasedRepo();
    const before = contents(repo);
    expect(() => prepareRelease(repo, { version: "1.0.1", date: "2026-10-21" })).toThrow(
      "at least a minor: 1.1.0",
    );
    expect(contents(repo)).toEqual(before);
  });
});
