import { describe, expect, it } from "vitest";
import type { Location } from "../location";
import { type ListRules, labelOf, listedEntries, listStructureOf } from "./model";

const north: Location = { id: "n", lat: 0, lng: 0, title: "North", group: "N" };
const south: Location = { id: "s", lat: 0, lng: 0, title: "  ", group: "S" };
const loose: Location = { id: "l", lat: 0, lng: 0, title: "Loose" };
const hidden: Location = { id: "h", lat: 0, lng: 0, group: "N", visible: false };
const locations = [north, south, loose, hidden];

function sections(rules: ListRules, groups?: string[], list = locations) {
  return listStructureOf({ locations: list, filter: groups && { groups } }, rules).sections.map(
    (section) => ({
      heading: section.heading,
      ids: section.locations.map((location) => location.id),
    }),
  );
}

describe("listStructureOf", () => {
  it("lists shown locations by group, ungrouped first, in first-appearance order", () => {
    expect(sections({ groupHeadings: undefined })).toEqual([
      { heading: undefined, ids: ["l"] },
      { heading: "N", ids: ["n"] },
      { heading: "S", ids: ["s"] },
    ]);
  });

  it("keeps data order in one section without headings", () => {
    expect(sections({ groupHeadings: false })).toEqual([
      { heading: undefined, ids: ["n", "s", "l"] },
    ]);
  });

  it("follows the filter", () => {
    expect(sections({ groupHeadings: false }, ["N"])).toEqual([{ heading: undefined, ids: ["n"] }]);
  });

  it("gives a blank group name its own section without a heading", () => {
    const blank: Location = { id: "b", lat: 0, lng: 0, group: "" };
    expect(sections({ groupHeadings: true }, undefined, [north, blank])).toEqual([
      { heading: "N", ids: ["n"] },
      { heading: undefined, ids: ["b"] },
    ]);
  });
});

describe("listStructureOf: locations not listed", () => {
  const unlisted: Location = { id: "u", lat: 0, lng: 0, group: "U", listed: false };

  it("leaves them out, and their groups' headings, with headings on or off", () => {
    const list = [...locations, unlisted];
    expect(sections({ groupHeadings: undefined }, undefined, list)).toEqual([
      { heading: undefined, ids: ["l"] },
      { heading: "N", ids: ["n"] },
      { heading: "S", ids: ["s"] },
    ]);
    expect(sections({ groupHeadings: false }, undefined, list)).toEqual([
      { heading: undefined, ids: ["n", "s", "l"] },
    ]);
  });
});

describe("listStructureOf: counts", () => {
  const labels = (list: readonly Location[], groupCounts?: boolean, groups?: string[]) =>
    listStructureOf(
      { locations: list, filter: groups && { groups } },
      { groupHeadings: undefined, groupCounts },
    ).sections.map((section) => section.label);
  const inNorth = (id: string, more?: Partial<Location>): Location =>
    ({ id, lat: 0, lng: 0, group: "N", ...more }) as Location;

  it("with groupCounts a heading's label is its name and how many are listed", () => {
    expect(labels([inNorth("a"), inNorth("b"), north, south], true)).toEqual(["N (3)", "S (1)"]);
  });

  it("counts only what is listed: the filter and listed: false lower it", () => {
    const list = [inNorth("a"), inNorth("b", { listed: false }), south];
    expect(labels(list, true)).toEqual(["N (1)", "S (1)"]);
    expect(labels(list, true, ["S"])).toEqual(["S (1)"]);
  });

  it("gives ungrouped places no label", () => {
    expect(labels([loose], true)).toEqual([undefined]);
  });

  it("gives no label without groupCounts", () => {
    expect(labels([north, south])).toEqual([undefined, undefined]);
    expect(labels([north, south], false)).toEqual([undefined, undefined]);
  });
});

describe("labelOf", () => {
  it("is the title when it has text, else the id", () => {
    expect([north, south, loose].map(labelOf)).toEqual(["North", "s", "Loose"]);
  });
});

describe("listedEntries", () => {
  it("lists what listStructureOf lists, in data order, narrowed to what it keeps", () => {
    const filtered = { locations, filter: { groups: ["N", "S"] } };
    const structure = listStructureOf(filtered, { groupHeadings: false });
    expect(listedEntries(filtered)).toEqual(structure.sections[0]?.locations);
    const kept = (location: Location) => location.id !== "s";
    expect(listedEntries(filtered, kept).map(({ id }) => id)).toEqual(["n"]);
  });
});
