import { describe, expect, it } from "vitest";
import { FIRST_PROVIDER } from "./example-providers.ts";
import {
  EXAMPLE_GROUPS,
  EXAMPLE_PAGE_ENTRIES,
  EXAMPLE_SECTIONS,
  findExamplePage,
  findGroupAtPath,
  groupDescription,
  groupHeading,
  groupPath,
} from "./example-sections.ts";
import { exampleNames, exampleProviders } from "./example-sources.ts";
import { HOME_INTRO } from "./home-page.ts";
import { liveVersions } from "./live-versions.ts";

/** The README's first snippet, not a section on the site. */
const README_EXAMPLE = "quick-start";

describe("EXAMPLE_SECTIONS", () => {
  it("is every example with a page, so none is left off the site", () => {
    const sections = EXAMPLE_SECTIONS.map(({ name }) => name).sort();
    expect(sections).toEqual(
      exampleNames()
        .filter((name) => name !== README_EXAMPLE)
        .sort(),
    );
  });

  it("has one section at most whose versions call save(), so save() writes that section's note", () => {
    const saving = EXAMPLE_SECTIONS.filter(({ name }) =>
      liveVersions(name, {}).some(({ callsSave }) => callsSave),
    );
    expect(saving.map(({ name }) => name)).toEqual(["polygon"]);
  });

  it("shows each example first on the page's first provider", () => {
    for (const { name } of EXAMPLE_SECTIONS) {
      expect(exampleProviders(name)[0], name).toBe(FIRST_PROVIDER);
    }
  });
});

describe("EXAMPLE_GROUPS", () => {
  it("groups the examples by feature, as chosen (D31)", () => {
    const groups = EXAMPLE_GROUPS.map(({ id, label, sections }) => [
      id,
      label,
      sections.map(({ name }) => name),
    ]);
    expect(groups).toEqual([
      [
        "markers",
        "Markers and popups",
        ["simple", "markers", "css-markers", "popups", "click-to-add"],
      ],
      ["lists", "Lists and menus", ["menu", "custom-list", "tabs"]],
      ["search", "Search and filters", ["tags", "offices", "search", "nearest", "this-area"]],
      ["circles-polygons", "Circles and polygons", ["circles", "polygon", "mixed", "choropleth"]],
      ["lines-routes", "Lines and routes", ["polyline", "flights", "trade-lanes", "route"]],
      ["clusters-heatmaps", "Clusters and heatmaps", ["big", "earthquakes"]],
      ["live-data", "Live data and loading", ["live-data", "load-on-demand", "link-to-place"]],
      ["styling", "Styling", ["whats-on", "team", "styled", "brand", "unstyled"]],
    ]);
  });

  it("holds every example once, numbered in its groups' order, at least two on each hub", () => {
    expect(EXAMPLE_GROUPS.flatMap(({ sections }) => sections)).toEqual(EXAMPLE_SECTIONS);
    expect(new Set(EXAMPLE_SECTIONS.map(({ name }) => name)).size).toBe(EXAMPLE_SECTIONS.length);
    for (const group of EXAMPLE_GROUPS)
      expect(group.sections.length, group.id).toBeGreaterThanOrEqual(2);
  });

  it("puts every hub under /examples/, none where the examples' files are served", () => {
    for (const group of EXAMPLE_GROUPS) expect(groupPath(group)).toBe(`/examples/${group.id}/`);
    const ids = EXAMPLE_GROUPS.map(({ id }) => id);
    expect(ids).not.toContain("data");
    expect(ids).not.toContain("styles");
  });

  it("describes each hub and each example's page by its own description, 80 to 160 characters", () => {
    for (const group of EXAMPLE_GROUPS) expect(groupDescription(group)).toBe(group.description);
    const described = [...EXAMPLE_GROUPS, ...EXAMPLE_SECTIONS];
    for (const { description } of described) {
      expect(description.length, description).toBeGreaterThanOrEqual(80);
      expect(description.length, description).toBeLessThanOrEqual(160);
    }
    expect(new Set(described.map(({ description }) => description)).size).toBe(described.length);
  });

  it("puts every example's page under its hub, in the numbering's order", () => {
    expect(EXAMPLE_PAGE_ENTRIES.map(({ section }) => section)).toEqual(EXAMPLE_SECTIONS);
    for (const { group, section, path } of EXAMPLE_PAGE_ENTRIES) {
      expect(path).toBe(`/examples/${group.id}/${section.name}/`);
    }
  });

  it("heads each hub with the feature in task words", () => {
    expect(EXAMPLE_GROUPS.map(groupHeading)).toEqual([
      "Custom markers and popups on Google Maps and MapLibre",
      "Lists and menus on Google Maps and MapLibre",
      "Search and filters on Google Maps and MapLibre",
      "Circles and polygons on Google Maps and MapLibre",
      "Lines and routes on Google Maps and MapLibre",
      "Marker clustering and heatmaps on Google Maps and MapLibre",
      "Live data and loading on Google Maps and MapLibre",
      "Map styles and customizations on Google Maps and MapLibre",
    ]);
  });

  it("introduces each hub by its own paragraph, apart from the home page's", () => {
    const intros = EXAMPLE_GROUPS.map(({ intro }) => intro);
    expect(new Set([...intros, HOME_INTRO]).size).toBe(EXAMPLE_GROUPS.length + 1);
  });

  it("titles each example once", () => {
    const titles = EXAMPLE_SECTIONS.map(({ title }) => title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("titles no section as its group's heading lead", () => {
    for (const group of EXAMPLE_GROUPS) {
      for (const section of group.sections)
        expect(section.title, section.name).not.toBe(group.headingLead);
    }
  });

  it("finds each group at its path, and none at a path no group has", () => {
    for (const group of EXAMPLE_GROUPS) expect(findGroupAtPath(groupPath(group))).toBe(group);
    for (const path of ["/", "/examples/lists", "/index.html", "/store/"])
      expect(findGroupAtPath(path), path).toBeUndefined();
  });

  it("finds each example's page by its name, and none for a name no example has", () => {
    for (const entry of EXAMPLE_PAGE_ENTRIES)
      expect(findExamplePage(entry.section.name)).toBe(entry);
    expect(findExamplePage("main")).toBeUndefined();
  });

  it("numbers the sections 1 to 31 across the groups, in order", () => {
    const labels = EXAMPLE_PAGE_ENTRIES.map(({ number }) => number);
    expect(labels).toEqual(
      Array.from({ length: 31 }, (_, index) => String(index + 1).padStart(2, "0")),
    );
  });
});
