import { describe, expect, it } from "vitest";
import { releaseNotes, withReleaseHeading } from "./changelog-release.ts";

const HEADER = "# Changelog\n\nNewest first: lines above the first heading are unreleased.\n";

const UNRELEASED = `${HEADER}
- 2026-10-20 Fixed the list's focus, see [the RFC](docs/rfc-1.0.md#errors) #12
- 2026-10-18 Added [a guide](https://example.com/guide) for \`hold\`

## 1.0.0 (2026-10-16)

- 2026-10-16 Changed everything
`;

const BLOB = "https://github.com/owner/repo/blob/v1.1.0/";

describe("withReleaseHeading", () => {
  it("puts the version's heading above the unreleased lines, below the header", () => {
    const released = withReleaseHeading(UNRELEASED, { version: "1.1.0", date: "2026-10-21" });
    expect(released).toBe(
      UNRELEASED.replace("\n- 2026-10-20", "\n## 1.1.0 (2026-10-21)\n\n- 2026-10-20"),
    );
  });

  it("heads a changelog with no line and no release at its end", () => {
    expect(withReleaseHeading(HEADER, { version: "1.1.0", date: "2026-10-21" })).toBe(
      `${HEADER}\n## 1.1.0 (2026-10-21)\n`,
    );
  });
});

describe("releaseNotes", () => {
  const released = withReleaseHeading(UNRELEASED, { version: "1.1.0", date: "2026-10-21" });

  it("are the version's lines, its relative links made absolute at the tag", () => {
    expect(releaseNotes(released, { version: "1.1.0", blobBase: BLOB })).toBe(
      [
        `- 2026-10-20 Fixed the list's focus, see [the RFC](${BLOB}docs/rfc-1.0.md#errors) #12`,
        "- 2026-10-18 Added [a guide](https://example.com/guide) for `hold`",
        "",
      ].join("\n"),
    );
  });

  it("are only that version's, not a pre-release's of the same numbers", () => {
    const both = released.replace(
      "## 1.0.0 (",
      "## 1.0.0-rc.1 (2026-10-10)\n\n- 2026-10-10 Fixed rc\n\n## 1.0.0 (",
    );
    expect(releaseNotes(both, { version: "1.0.0", blobBase: BLOB })).toBe(
      "- 2026-10-16 Changed everything\n",
    );
  });

  it("give a stable version its pre-releases' lines, and a pre-release only its own", () => {
    const rc = withReleaseHeading(UNRELEASED, { version: "1.1.0-rc.1", date: "2026-10-20" });
    const stable = withReleaseHeading(rc, { version: "1.1.0", date: "2026-10-21" });
    expect(stable).toContain(
      "\n## 1.1.0 (2026-10-21)\n\n## 1.1.0-rc.1 (2026-10-20)\n\n- 2026-10-20",
    );
    const notes = (version: string) =>
      releaseNotes(stable, { version, blobBase: BLOB }).split("\n");
    expect(notes("1.1.0")).toHaveLength(3);
    expect(notes("1.1.0-rc.1")).toHaveLength(3);
    const withFix = stable.replace(
      "## 1.1.0 (2026-10-21)\n",
      "## 1.1.0 (2026-10-21)\n\n- 2026-10-21 Fixed rc\n",
    );
    expect(releaseNotes(withFix, { version: "1.1.0", blobBase: BLOB })).toContain("Fixed rc");
    expect(releaseNotes(withFix, { version: "1.1.0", blobBase: BLOB }).split("\n")).toHaveLength(4);
    expect(releaseNotes(withFix, { version: "1.1.0-rc.1", blobBase: BLOB })).not.toContain(
      "Fixed rc",
    );
  });

  it("refuses a version without a heading", () => {
    expect(() => releaseNotes(released, { version: "1.2.0", blobBase: BLOB })).toThrow(
      "CHANGELOG.md has no heading for 1.2.0",
    );
  });
});
