import { describe, expect, it } from "vitest";
import { groupKey, groupOfPath, groupPathOf, inAnyGroup, isInGroup } from "./group-path";

describe("group paths", () => {
  it("a string and a one-name path are the same group", () => {
    expect(groupPathOf("Italy")).toEqual(["Italy"]);
    expect(groupKey(groupPathOf("Italy") ?? [])).toBe(groupKey(["Italy"]));
    expect(isInGroup("Italy", ["Italy"])).toBe(true);
    expect(isInGroup(["Italy"], "Italy")).toBe(true);
    expect(groupOfPath(["Italy"])).toBe("Italy");
    expect(groupOfPath(["Europe", "Italy"])).toEqual(["Europe", "Italy"]);
  });

  it("a group matches its subgroups, not its parent or siblings", () => {
    const rome = ["Europe", "Italy", "Rome"];
    expect(isInGroup(rome, "Europe")).toBe(true);
    expect(isInGroup(rome, ["Europe", "Italy"])).toBe(true);
    expect(isInGroup(["Europe", "Italy"], rome)).toBe(false);
    expect(isInGroup(["Europe", "France"], ["Europe", "Italy"])).toBe(false);
    expect(isInGroup(undefined, "Europe")).toBe(false);
  });

  it("a name matches only at the top: Rome isn't Europe › Italy › Rome", () => {
    expect(isInGroup(["Europe", "Italy", "Rome"], "Rome")).toBe(false);
  });

  it("keys tell paths apart where joined names wouldn't", () => {
    expect(groupKey(["a b", "c"])).not.toBe(groupKey(["a", "b c"]));
  });

  it("is in any of the groups asked for", () => {
    expect(inAnyGroup(["Asia", "Japan"], ["Europe", ["Asia"]])).toBe(true);
    expect(inAnyGroup(["Asia", "Japan"], ["Europe"])).toBe(false);
    expect(inAnyGroup(undefined, [])).toBe(false);
  });
});
