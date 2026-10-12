import { describe, expect, it } from "vitest";
import { child, root } from "./fail";
import { checkGroups } from "./filter";

const groups = child(root("setFilter"), "groups");

describe("checkGroups", () => {
  it("accepts a list of groups, or undefined to show every group", () => {
    expect(() => checkGroups(["North", "Centre"], groups)).not.toThrow();
    expect(() => checkGroups([], groups)).not.toThrow();
    expect(() => checkGroups(undefined, groups)).not.toThrow();
  });

  it("rejects something that is not a list of strings", () => {
    expect(() => checkGroups("North", groups)).toThrow(
      /^setFilter: groups must be an array of groups, got "North"$/,
    );
    expect(() => checkGroups(["North", 2], groups)).toThrow(/groups\[1\] must be a string, got 2/);
  });
});
