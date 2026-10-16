import { describe, expect, it } from "vitest";
import { compareVersions, isPrerelease, parseVersion } from "./versions.ts";

describe("parseVersion", () => {
  it("reads a release and a pre-release", () => {
    expect(parseVersion("1.2.3")).toEqual({
      major: 1,
      minor: 2,
      patch: 3,
      prerelease: [],
      text: "1.2.3",
    });
    expect(parseVersion("1.0.0-beta.2").prerelease).toEqual(["beta", "2"]);
  });

  it.each([
    "1.2",
    "v1.2.3",
    "01.2.3",
    "1.2.3-01",
    "1.2.3+build.5",
    "1.2.3-",
    "1.2.3-beta..1",
    " 1.2.3",
  ])("refuses %j", (text) => {
    expect(() => parseVersion(text)).toThrow(
      `${text} is not a version (x.y.z or x.y.z-pre.release)`,
    );
  });
});

describe("compareVersions", () => {
  const ordered = [
    "0.9.9",
    "1.0.0-alpha",
    "1.0.0-alpha.1",
    "1.0.0-alpha.beta",
    "1.0.0-beta",
    "1.0.0-beta.2",
    "1.0.0-beta.11",
    "1.0.0-rc.1",
    "1.0.0",
    "1.0.1",
    "1.1.0",
    "2.0.0",
  ];

  it("orders versions by SemVer precedence", () => {
    const shuffled = [...ordered].reverse().map(parseVersion);
    expect(shuffled.sort(compareVersions).map(({ text }) => text)).toEqual(ordered);
  });

  it("finds equal versions equal", () => {
    expect(compareVersions(parseVersion("1.0.0-rc.1"), parseVersion("1.0.0-rc.1"))).toBe(0);
  });
});

describe("isPrerelease", () => {
  it("is true only for a version with a pre-release part", () => {
    expect(isPrerelease(parseVersion("1.0.0-rc.1"))).toBe(true);
    expect(isPrerelease(parseVersion("1.0.0"))).toBe(false);
  });
});
