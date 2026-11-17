import { describe, expect, it } from "vitest";
import type { LocationGroup } from "../group-path";
import type { Location } from "../location";
import { choiceStateOf, groupsAfterTicking, groupsAfterUnticking } from "./group-choice";
import { groupTreeOf } from "./group-tree";

const office = (id: string, group: LocationGroup): Location => ({ id, lat: 0, lng: 0, group });
const tree = groupTreeOf([
  office("milan", ["Europe", "Italy"]),
  office("paris", ["Europe", "France"]),
  office("tokyo", ["Asia", "Japan"]),
]).groups;
const states = (groups: readonly LocationGroup[] | undefined) =>
  Object.fromEntries(
    [...choiceStateOf(tree, groups)].map(([key, state]) => [JSON.parse(key).join(" › "), state]),
  );

describe("choiceStateOf", () => {
  it("all on without groups", () => {
    expect(new Set(Object.values(states(undefined)))).toEqual(new Set(["on"]));
  });

  it("a subgroup asked for makes its parent mixed", () => {
    expect(states([["Europe", "Italy"]])).toEqual({
      Europe: "mixed",
      "Europe › Italy": "on",
      "Europe › France": "off",
      Asia: "off",
      "Asia › Japan": "off",
    });
  });

  it("each child asked for makes a parent with no own entries on", () => {
    expect(
      states([
        ["Europe", "Italy"],
        ["Europe", "France"],
      ]).Europe,
    ).toBe("on");
  });

  it("a parent with entries of its own stays mixed with every child asked for", () => {
    const withHq = groupTreeOf([office("hq", "Europe"), office("milan", ["Europe", "Italy"])]);
    expect(choiceStateOf(withHq.groups, [["Europe", "Italy"]]).get('["Europe"]')).toBe("mixed");
  });
});

describe("groupsAfterTicking and groupsAfterUnticking", () => {
  it("unticking a subgroup of a ticked parent leaves its siblings", () => {
    expect(groupsAfterUnticking(tree, ["Europe", "Asia"], ["Europe", "Italy"])).toEqual([
      ["Europe", "France"],
      "Asia",
    ]);
  });

  it("unticking a parent drops its subgroups the page asked for too", () => {
    expect(groupsAfterUnticking(tree, ["Europe", ["Europe", "Italy"], "Asia"], ["Europe"])).toEqual(
      ["Asia"],
    );
  });

  it("ticking every subgroup of a parent with no own entries gives the parent", () => {
    expect(groupsAfterTicking(tree, [["Europe", "Italy"]], ["Europe", "France"])).toEqual([
      "Europe",
    ]);
  });

  it("ticking the last box gives no groups filter", () => {
    expect(groupsAfterTicking(tree, ["Europe"], ["Asia"])).toBeUndefined();
    expect(groupsAfterTicking(tree, ["Europe", ["Asia", "Japan"]], ["Asia"])).toBeUndefined();
  });

  it("unticking every box gives an empty list", () => {
    expect(groupsAfterUnticking(tree, ["Asia"], ["Asia"])).toEqual([]);
    expect(groupsAfterUnticking(tree, undefined, ["Europe"])).toEqual(["Asia"]);
  });

  it("a flat store's groups stay strings", () => {
    const flat = groupTreeOf([office("q", "Quakes"), office("v", "Volcanoes")]).groups;
    expect(groupsAfterUnticking(flat, undefined, ["Volcanoes"])).toEqual(["Quakes"]);
  });

  it("a path the tree doesn't hold is kept", () => {
    expect(groupsAfterTicking(tree, [["Europe", "Spain"]], ["Asia"])).toEqual([
      "Asia",
      ["Europe", "Spain"],
    ]);
  });

  it("unticking a parent removes a kept path under it", () => {
    expect(groupsAfterUnticking(tree, ["Asia", ["Europe", "Spain"]], ["Europe"])).toEqual(["Asia"]);
  });

  it("unticking a subgroup of a parent with entries of its own hides them", () => {
    const withHq = groupTreeOf([
      office("hq", "Europe"),
      office("milan", ["Europe", "Italy"]),
      office("paris", ["Europe", "France"]),
      office("tokyo", ["Asia", "Japan"]),
    ]).groups;
    expect(groupsAfterUnticking(withHq, undefined, ["Europe", "Italy"])).toEqual([
      ["Europe", "France"],
      "Asia",
    ]);
  });

  it("a fully ticked level 3 collapses to its level 1 parent", () => {
    const deep = groupTreeOf([
      office("a", ["Europe", "Italy", "Rome"]),
      office("b", ["Europe", "Italy", "Milan"]),
      office("c", ["Asia"]),
    ]).groups;
    const groups = [["Europe", "Italy", "Rome"]];
    expect(groupsAfterTicking(deep, groups, ["Europe", "Italy", "Milan"])).toEqual(["Europe"]);
  });
});
