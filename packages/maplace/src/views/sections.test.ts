// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import type { Location } from "../location";
import { structureOf } from "../testing/lists";
import { createSections } from "./sections";

const north: Location = { id: "n", lat: 0, lng: 0, group: "N" };
const loose: Location = { id: "l", lat: 0, lng: 0 };

function sectionsIn(container: HTMLElement) {
  const fills: string[] = [];
  const names: string[] = [];
  const sections = createSections<unknown, HTMLElement>(container, {
    option: () => document.createElement("span"),
    fill: (option, location) => {
      fills.push(location.id);
      option.textContent = location.id;
    },
    group: () => {
      const element = document.createElement("section");
      const head = document.createElement("h3");
      const name = (text: string) => {
        names.push(text);
        head.textContent = text;
      };
      return { element, head: [head], name };
    },
  });
  return { sections, fills, names };
}

describe("createSections", () => {
  it("puts the fixed elements first, then ungrouped options, then groups with their head", () => {
    const container = document.createElement("div");
    const { sections } = sectionsIn(container);
    const fixed = document.createElement("hr");
    const ordered = sections.render(structureOf([north, loose]), [fixed]);
    expect(Array.from(container.children, (child) => child.tagName)).toEqual([
      "HR",
      "SPAN",
      "SECTION",
    ]);
    expect(container.querySelector("section")?.textContent).toBe("Nn");
    expect(ordered.map((option) => option.textContent)).toEqual(["l", "n"]);
  });

  it("keeps options and groups across renders, filling again only for a new location object", () => {
    const container = document.createElement("div");
    const { sections, fills } = sectionsIn(container);
    sections.render(structureOf([north, loose]), []);
    const option = sections.optionOf("n");
    const group = container.querySelector("section");
    sections.render(structureOf([north, { ...loose }]), []);
    expect(sections.optionOf("n")).toBe(option);
    expect(container.querySelector("section")).toBe(group);
    expect(fills).toEqual(["l", "n", "l"]);
    expect(sections.locationOf(option as Element)).toBe(north);
  });

  it("names a group again when its label changes, keeping its element", () => {
    const container = document.createElement("div");
    const { sections } = sectionsIn(container);
    const counted = (list: Location[]) =>
      sections.render(structureOf(list, { groupHeadings: undefined, groupCounts: true }), []);
    counted([north, { ...north, id: "m" }]);
    const group = container.querySelector("section");
    expect(group?.querySelector("h3")?.textContent).toBe("N (2)");
    counted([north]);
    expect(container.querySelector("section")).toBe(group);
    expect(group?.querySelector("h3")?.textContent).toBe("N (1)");
  });

  it("doesn't give a group the same name twice", () => {
    const { sections, names } = sectionsIn(document.createElement("div"));
    sections.render(structureOf([north]), []);
    sections.render(structureOf([north, loose]), []);
    expect(names).toEqual(["N"]);
  });

  it("forgets options and groups no longer listed", () => {
    const container = document.createElement("div");
    const { sections } = sectionsIn(container);
    sections.render(structureOf([north, loose]), []);
    sections.render(structureOf([loose]), []);
    expect(sections.optionOf("n")).toBeUndefined();
    expect(container.querySelector("section")).toBeNull();
  });
});

describe("createSections: distances", () => {
  const withMetres = (metres: number) => ({
    ...structureOf([north]),
    distances: {
      from: { lat: 0, lng: 0 },
      of: new Map([["n", { metres, label: `${metres} m` }]]),
    },
  });

  it("fills an entry again only when its metres changed", () => {
    const { sections, fills } = sectionsIn(document.createElement("div"));
    sections.render(withMetres(5), []);
    sections.render(withMetres(5), []);
    expect(fills).toEqual(["n"]);
    sections.render(withMetres(6), []);
    expect(fills).toEqual(["n", "n"]);
    sections.render(structureOf([north]), []);
    expect(fills).toEqual(["n", "n", "n"]);
  });

  it("says how far the entry an option shows is", () => {
    const { sections } = sectionsIn(document.createElement("div"));
    const [option] = sections.render(withMetres(5), []);
    expect(option && sections.distanceOf(option)?.label).toBe("5 m");
  });
});
