import { describe, expect, it } from "vitest";
import { FIRST_PROVIDER } from "./example-providers.ts";
import {
  EXAMPLE_GROUPS,
  EXAMPLE_SECTIONS,
  findGroupAtPath,
  findGroupOfSection,
  groupDescription,
  groupPath,
  groupTitle,
  HOME_GROUP,
  sectionNumber,
} from "./example-sections.ts";
import { exampleNames, exampleProviders } from "./example-sources.ts";
import { liveVersions } from "./live-versions.ts";

/** The hero's snippet, not a section. */
const HERO_EXAMPLE = "quick-start";

describe("EXAMPLE_SECTIONS", () => {
  it("is every example with a page, so none is left off the home page", () => {
    const sections = EXAMPLE_SECTIONS.map(({ name }) => name).sort();
    expect(sections).toEqual(
      exampleNames()
        .filter((name) => name !== HERO_EXAMPLE)
        .sort(),
    );
  });

  it("has one section at most whose versions call save(), so save() writes that section's note", () => {
    const saving = EXAMPLE_SECTIONS.filter(({ name }) =>
      liveVersions(name, {}).some(({ callsSave }) => callsSave),
    );
    expect(saving.map(({ name }) => name)).toEqual(["polygon"]);
  });

  it("says why a section runs on Google only exactly when it has no MapLibre versions", () => {
    for (const { name, googleOnlyBecause } of EXAMPLE_SECTIONS) {
      const onMapLibre = exampleProviders(name).includes("maplibre");
      expect(googleOnlyBecause === undefined, name).toBe(onMapLibre);
    }
  });

  it("shows each section first on the page's first provider, route on Google, the one it has", () => {
    for (const { name, googleOnlyBecause } of EXAMPLE_SECTIONS)
      expect(exampleProviders(name)[0], name).toBe(googleOnlyBecause ? "google" : FIRST_PROVIDER);
  });
});

describe("EXAMPLE_GROUPS", () => {
  it("groups the examples as chosen (W38)", () => {
    const groups = EXAMPLE_GROUPS.map(({ id, label, sections }) => [
      id,
      label,
      sections.map(({ name }) => name),
    ]);
    expect(groups).toEqual([
      ["basics", "Basics", ["simple", "markers"]],
      ["lists", "Lists", ["menu", "tags", "custom-list", "tabs"]],
      ["shapes", "Shapes", ["circles", "polyline", "polygon"]],
      ["data-routes", "Data & routes", ["mixed", "big", "route"]],
      ["styling", "Styling", ["styled", "css-markers", "brand", "unstyled"]],
    ]);
  });

  it("holds every example once, numbered in its groups' order", () => {
    expect(EXAMPLE_GROUPS.flatMap(({ sections }) => sections)).toEqual(EXAMPLE_SECTIONS);
    expect(new Set(EXAMPLE_SECTIONS.map(({ name }) => name)).size).toBe(EXAMPLE_SECTIONS.length);
  });

  it("puts the first group on the home page, the others under /examples/", () => {
    expect(EXAMPLE_GROUPS.map(groupPath)).toEqual([
      "/",
      "/examples/lists/",
      "/examples/shapes/",
      "/examples/data-routes/",
      "/examples/styling/",
    ]);
  });

  it("describes each group's page by its own description, not the summary it shows", () => {
    const descriptions = EXAMPLE_GROUPS.map(groupDescription);
    expect(descriptions).toEqual(EXAMPLE_GROUPS.map(({ description }) => description));
    expect(descriptions[0]).toMatch(/^A list of locations becomes a map/);
  });

  it("titles the first group's page as the home page, the others by their label", () => {
    expect(EXAMPLE_GROUPS.map(groupTitle)).toEqual([
      "maplacejs: a JavaScript library for Google Maps and MapLibre",
      "Lists: maplacejs examples",
      "Shapes: maplacejs examples",
      "Data & routes: maplacejs examples",
      "Styling: maplacejs examples",
    ]);
  });

  it("finds each group at its path, and none at a path no group has", () => {
    for (const group of EXAMPLE_GROUPS) expect(findGroupAtPath(groupPath(group))).toBe(group);
    for (const path of ["/examples/lists", "/index.html", "/store/"])
      expect(findGroupAtPath(path), path).toBeUndefined();
  });

  it("finds the group holding each section, and none for a name no section has", () => {
    for (const group of EXAMPLE_GROUPS) {
      for (const { name } of group.sections) expect(findGroupOfSection(name)).toBe(group);
    }
    expect(findGroupOfSection("main")).toBeUndefined();
  });

  it("numbers the sections 1 to 16 across the groups, in order, Basics on the home page", () => {
    const numbers = EXAMPLE_GROUPS.flatMap(({ sections }) => sections.map(sectionNumber));
    expect(numbers).toEqual(Array.from({ length: 16 }, (_, index) => index + 1));
    expect(HOME_GROUP.id).toBe("basics");
  });
});
