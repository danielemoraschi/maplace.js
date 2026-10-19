import { describe, expect, it } from "vitest";
import { readRootFile } from "../../../../scripts/build/package.ts";
import {
  CHANGELOG_FILE,
  issuesNamedIn,
  listLines,
} from "../../../../scripts/checks/changelog-lines.ts";
import { changelogMarkdown } from "./changelog-markdown.ts";

const LINKS = {
  routes: { "MIGRATION.md": "/migrating/" },
  blobBase: "https://github.com/o/r/blob/abc123/",
  issueBase: "https://github.com/o/r/issues/",
};

const RELEASED = "# Changelog\n\nIntro.\n\n## 0.2.10 (2017-04-02)\n\n- 2017-04-02 Fixed x\n";
const WITH_UNRELEASED =
  "# Changelog\n\nIntro.\n\n- 2026-10-18 Added y\n\n## 0.2.10 (2017-04-02)\n\n- 2017-04-02 Fixed x\n";

const entry = (line: string) => changelogMarkdown(`# Changelog\n\n${line}\n`, LINKS);

describe("changelogMarkdown", () => {
  it("drops the file's title and intro, which the page writes", () => {
    const markdown = changelogMarkdown(RELEASED, LINKS);
    expect(markdown.startsWith("## 0.2.10 (2017-04-02)")).toBe(true);
    expect(markdown).not.toContain("Intro.");
  });

  it("heads the lines above the first version Unreleased", () => {
    const markdown = changelogMarkdown(WITH_UNRELEASED, LINKS);
    expect(markdown.startsWith("## Unreleased\n\n- <time")).toBe(true);
    expect(markdown).toContain("\n## 0.2.10 (2017-04-02)\n");
  });

  it("has no Unreleased heading when every line is released", () => {
    expect(changelogMarkdown(RELEASED, LINKS)).not.toContain("Unreleased");
  });

  it("renders nothing for a changelog with no lines yet", () => {
    expect(changelogMarkdown("# Changelog\n\nIntro.\n", LINKS)).toBe("");
  });

  it("marks each line's date as a time", () => {
    expect(entry("- 2026-10-18 Added y")).toContain(
      '- <time datetime="2026-10-18">2026-10-18</time> Added y',
    );
  });

  it("links the trailing issues to their GitHub pages, as the CHANGELOG check reads them", () => {
    expect(entry("- 2017-04-02 Fixed x #147 #139")).toContain(
      "Fixed x [#147](https://github.com/o/r/issues/147) [#139](https://github.com/o/r/issues/139)",
    );
    expect(entry("- 2017-04-02 Fixed #3 in the menu")).toContain("Fixed #3 in the menu");
  });

  it("sends repo links to the site's pages, or to the repo at the commit built", () => {
    expect(entry("- 2026-10-18 Added z; see [MIGRATION.md](MIGRATION.md#options)")).toContain(
      "[MIGRATION.md](/migrating/#options)",
    );
    expect(entry("- 2026-10-18 Added z; see [the RFC](docs/rfc-1.0.md)")).toContain(
      "[the RFC](https://github.com/o/r/blob/abc123/docs/rfc-1.0.md)",
    );
  });

  it("refuses a line out of format, naming it", () => {
    expect(() => changelogMarkdown("- Added z\n", LINKS)).toThrow(
      /CHANGELOG\.md line 1: - Added z/,
    );
  });

  it("dates every line of CHANGELOG.md and links the issues the check reads", () => {
    const changelog = readRootFile(CHANGELOG_FILE);
    const markdown = changelogMarkdown(changelog, LINKS);
    const lines = listLines(changelog);
    expect(markdown.match(/<time datetime=/g)).toHaveLength(lines.length);
    const linked = Array.from(markdown.matchAll(/\/issues\/(\d+)\)/g), ([, n]) => Number(n));
    expect(new Set(linked)).toEqual(issuesNamedIn(lines));
  });
});
