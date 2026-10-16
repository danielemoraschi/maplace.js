import { describe, expect, it } from "vitest";
import { planRelease } from "./release-plan.ts";
import { ReleaseRefused } from "./release-refused.ts";

const LEGACY_TAGS = ["0.2.10", "0.2.9", "v0.1.2", "v0.1.33"];

const changelog = (...verbs: string[]) =>
  [
    "# Changelog",
    "",
    ...verbs.map((verb) => `- 2026-10-20 ${verb} something`),
    "",
    "## 0.2.10 (2017-04-02)",
    "",
    "- 2017-04-02 Fixed afterRoute #147",
    "",
  ].join("\n");

const refusal = (attempt: () => unknown) => {
  try {
    attempt();
  } catch (error) {
    expect(error).toBeInstanceOf(ReleaseRefused);
    return (error as Error).message;
  }
  throw new Error("not refused");
};

describe("planRelease", () => {
  it("plans the first release past the legacy tags, to latest", () => {
    expect(
      planRelease({ version: "1.0.0", tags: LEGACY_TAGS, changelog: changelog("Changed") }),
    ).toEqual({
      tag: "v1.0.0",
      distTag: "latest",
      prerelease: false,
      lastReleased: undefined,
    });
  });

  it("sends a pre-release to next, and names the last release", () => {
    const tags = [...LEGACY_TAGS, "v1.0.0", "v1.1.0-beta.1"];
    expect(planRelease({ version: "1.1.0-beta.2", tags, changelog: changelog("Added") })).toEqual({
      tag: "v1.1.0-beta.2",
      distTag: "next",
      prerelease: true,
      lastReleased: "1.1.0-beta.1",
    });
  });

  it("releases a stable version over its pre-releases, judged by every line since the last", () => {
    const afterRc = [
      "# Changelog",
      "",
      "## 1.1.0-rc.1 (2026-10-20)",
      "",
      "- 2026-10-20 Added something",
      "",
      "## 1.0.0 (2026-10-16)",
      "",
      "- 2026-10-16 Changed everything",
      "",
    ].join("\n");
    const tags = ["v1.0.0", "v1.1.0-rc.1"];
    expect(planRelease({ version: "1.1.0", tags, changelog: afterRc })).toMatchObject({
      tag: "v1.1.0",
      distTag: "latest",
    });
    expect(refusal(() => planRelease({ version: "1.1.0-rc.2", tags, changelog: afterRc }))).toBe(
      "CHANGELOG.md has no unreleased lines: nothing to release",
    );
  });

  it("refuses what isn't a version", () => {
    expect(
      refusal(() => planRelease({ version: "v1.0", tags: [], changelog: changelog("Fixed") })),
    ).toBe("v1.0 is not a version (x.y.z or x.y.z-pre.release)");
  });

  it("refuses a version of the legacy 0.x line", () => {
    expect(
      refusal(() => planRelease({ version: "0.9.0", tags: [], changelog: changelog("Fixed") })),
    ).toBe("0.9.0 is below 1.0.0: the 0.x versions are the legacy line");
  });

  it("refuses a version released already", () => {
    const tags = ["v1.0.0", "v1.1.0"];
    expect(
      refusal(() => planRelease({ version: "1.1.0", tags, changelog: changelog("Fixed") })),
    ).toBe("1.1.0 is not above v1.1.0, the highest release");
  });

  it("refuses a version not above every release, a pre-release's included", () => {
    const tags = ["v1.0.0", "v1.1.0-rc.1"];
    expect(
      refusal(() => planRelease({ version: "1.0.5", tags, changelog: changelog("Fixed") })),
    ).toBe("1.0.5 is not above v1.1.0-rc.1, the highest release");
  });

  it("refuses a changelog with nothing unreleased", () => {
    expect(
      refusal(() => planRelease({ version: "1.0.1", tags: ["v1.0.0"], changelog: changelog() })),
    ).toBe("CHANGELOG.md has no unreleased lines: nothing to release");
  });

  it("refuses a line out of format before judging the version by it", () => {
    const tags = ["v1.0.0"];
    const out = changelog("Fixed").replace("Fixed something", "Breaking: removed something");
    expect(refusal(() => planRelease({ version: "1.0.1", tags, changelog: out }))).toBe(
      "CHANGELOG.md has a line out of format: - 2026-10-20 Breaking: removed something",
    );
  });

  it("refuses a version below what its lines call for", () => {
    expect(
      refusal(() =>
        planRelease({ version: "1.0.1", tags: ["v1.0.0"], changelog: changelog("Added") }),
      ),
    ).toBe("1.0.1 is a patch after 1.0.0, and an Added line calls for at least a minor: 1.1.0");
  });
});
