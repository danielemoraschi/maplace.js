import { describe, expect, it } from "vitest";
import type { Location } from "../location";
import { type ListRules, labelOf, listStructureOf } from "./model";

const north: Location = { id: "n", lat: 0, lng: 0, title: "North", group: "N" };
const south: Location = { id: "s", lat: 0, lng: 0, title: "  ", group: "S" };
const loose: Location = { id: "l", lat: 0, lng: 0, title: "Loose" };
const hidden: Location = { id: "h", lat: 0, lng: 0, group: "N", visible: false };
const locations = [north, south, loose, hidden];

function sections(rules: ListRules, filter?: string[], list = locations) {
  return listStructureOf({ locations: list, filter }, rules).sections.map((section) => ({
    heading: section.heading,
    ids: section.locations.map((location) => location.id),
  }));
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

  it("follows the filter and the matches rule", () => {
    expect(sections({ groupHeadings: false }, ["N"])).toEqual([{ heading: undefined, ids: ["n"] }]);
    const onlyLoose = {
      groupHeadings: false,
      matches: (location: Location) => location.id === "l",
    };
    expect(sections(onlyLoose)).toEqual([{ heading: undefined, ids: ["l"] }]);
  });

  it("gives a blank group name its own section without a heading", () => {
    const blank: Location = { id: "b", lat: 0, lng: 0, group: "" };
    expect(sections({ groupHeadings: true }, undefined, [north, blank])).toEqual([
      { heading: "N", ids: ["n"] },
      { heading: undefined, ids: ["b"] },
    ]);
  });
});

describe("labelOf", () => {
  it("is the title when it has text, else the id", () => {
    expect([north, south, loose].map(labelOf)).toEqual(["North", "s", "Loose"]);
  });
});
