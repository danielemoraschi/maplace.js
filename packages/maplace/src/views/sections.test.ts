// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import type { Location } from "../location";
import { structureOf } from "../testing/lists";
import { createSections } from "./sections";

const north: Location = { id: "n", lat: 0, lng: 0, group: "N" };
const loose: Location = { id: "l", lat: 0, lng: 0 };

function sectionsIn(container: HTMLElement) {
  const fills: string[] = [];
  const sections = createSections<unknown, HTMLElement>(container, {
    option: () => document.createElement("span"),
    fill: (option, location) => {
      fills.push(location.id);
      option.textContent = location.id;
    },
    group: (heading) => {
      const element = document.createElement("section");
      const head = document.createElement("h3");
      head.textContent = heading;
      return { element, head: [head] };
    },
  });
  return { sections, fills };
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

  it("forgets options and groups no longer listed", () => {
    const container = document.createElement("div");
    const { sections } = sectionsIn(container);
    sections.render(structureOf([north, loose]), []);
    sections.render(structureOf([loose]), []);
    expect(sections.optionOf("n")).toBeUndefined();
    expect(container.querySelector("section")).toBeNull();
  });
});
