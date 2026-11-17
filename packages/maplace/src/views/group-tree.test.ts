import { describe, expect, it } from "vitest";
import type { Location } from "../location";
import { countOf, type GroupNode, groupTreeOf } from "./group-tree";

const at = { lat: 0, lng: 0 };
const milan: Location = { id: "milan", ...at, group: ["Europe", "Italy"] };
const tokyo: Location = { id: "tokyo", ...at, group: ["Asia", "Japan"] };
const paris: Location = { id: "paris", ...at, group: ["Europe", "France"] };
const rome: Location = { id: "rome", ...at, group: ["Europe", "Italy"] };
const loose: Location = { id: "loose", ...at };

function shape(node: GroupNode): unknown {
  return { name: node.name, own: node.own.map(({ id }) => id), children: node.children.map(shape) };
}

describe("groupTreeOf", () => {
  it("nests paths in first-appearance order", () => {
    const { ungrouped, groups } = groupTreeOf([milan, tokyo, loose, paris, rome]);
    expect(ungrouped.map(({ id }) => id)).toEqual(["loose"]);
    expect(groups.map(shape)).toEqual([
      {
        name: "Europe",
        own: [],
        children: [
          { name: "Italy", own: ["milan", "rome"], children: [] },
          { name: "France", own: ["paris"], children: [] },
        ],
      },
      { name: "Asia", own: [], children: [{ name: "Japan", own: ["tokyo"], children: [] }] },
    ]);
    expect(groups[0]?.children[0]?.path).toEqual(["Europe", "Italy"]);
  });

  it("a string group and a one-name path share a node", () => {
    const hq: Location = { id: "hq", ...at, group: "Europe" };
    const office: Location = { id: "office", ...at, group: ["Europe"] };
    const { groups } = groupTreeOf([hq, milan, office]);
    expect(groups.map(shape)).toEqual([
      {
        name: "Europe",
        own: ["hq", "office"],
        children: [{ name: "Italy", own: ["milan"], children: [] }],
      },
    ]);
  });

  it("a parent counts its subgroups' entries", () => {
    const { groups } = groupTreeOf([milan, paris, rome, { id: "hq", ...at, group: "Europe" }]);
    expect(groups.map(countOf)).toEqual([4]);
    expect(groups[0]?.children.map(countOf)).toEqual([2, 1]);
  });
});
