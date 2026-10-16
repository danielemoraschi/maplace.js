import { describe, expect, it } from "vitest";
import { assertMeetsFloor, bumpBetween } from "./version-floor.ts";
import { parseVersion } from "./versions.ts";

const line = (verb: string) => `- 2026-10-20 ${verb} something`;
const v = parseVersion;

describe("bumpBetween", () => {
  it("is the largest part of the version that moved", () => {
    expect(bumpBetween(v("1.2.3"), v("1.2.4"))).toBe("patch");
    expect(bumpBetween(v("1.2.3"), v("1.3.0"))).toBe("minor");
    expect(bumpBetween(v("1.2.3"), v("2.0.0-rc.1"))).toBe("major");
  });
});

describe("assertMeetsFloor", () => {
  const lastStable = v("1.0.0");

  it("passes a version at or above what the lines call for", () => {
    expect(() =>
      assertMeetsFloor(v("1.0.1"), { lastStable, lines: [line("Fixed")] }),
    ).not.toThrow();
    expect(() =>
      assertMeetsFloor(v("2.0.0"), { lastStable, lines: [line("Changed")] }),
    ).not.toThrow();
    expect(() =>
      assertMeetsFloor(v("1.1.0-beta.1"), { lastStable, lines: [line("Added")] }),
    ).not.toThrow();
  });

  it("refuses a patch when a line adds something", () => {
    expect(() =>
      assertMeetsFloor(v("1.0.1"), { lastStable, lines: [line("Fixed"), line("Added")] }),
    ).toThrow("1.0.1 is a patch after 1.0.0, and an Added line calls for at least a minor: 1.1.0");
  });

  it("refuses a patch when a line changes something", () => {
    expect(() => assertMeetsFloor(v("1.0.1"), { lastStable, lines: [line("Changed")] })).toThrow(
      "1.0.1 is a patch after 1.0.0, and a Changed line calls for at least a minor: 1.1.0",
    );
  });

  it("refuses less than a major when a line removes something", () => {
    expect(() => assertMeetsFloor(v("1.1.0"), { lastStable, lines: [line("Removed")] })).toThrow(
      "1.1.0 is a minor after 1.0.0, and a Removed line calls for at least a major: 2.0.0",
    );
  });

  it("sets no floor before the first stable release", () => {
    expect(() =>
      assertMeetsFloor(v("1.0.0"), { lastStable: undefined, lines: [line("Removed")] }),
    ).not.toThrow();
  });
});
