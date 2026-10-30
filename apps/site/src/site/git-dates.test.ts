import { describe, expect, it } from "vitest";
import { gitIn } from "../../../../scripts/build/git.ts";
import { ROOT } from "../../../../scripts/build/package.ts";
import { lastChangeOf } from "./git-dates.ts";

/** A committed file nobody edits while the tests run. */
const COMMITTED = "LICENSE";

describe("lastChangeOf", () => {
  it("gives the author date of the last commit touching a path", () => {
    const logged = gitIn(ROOT, ["log", "-1", "--format=%as", "--", COMMITTED]).trim();
    expect(lastChangeOf([COMMITTED])).toBe(logged);
  });

  it("throws naming a path git has no history for", () => {
    expect(() => lastChangeOf(["no/such/file.md"])).toThrow("no/such/file.md");
  });
});
