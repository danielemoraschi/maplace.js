import { describe, expect, it } from "vitest";
import { FIRST_PROVIDER } from "./example-providers.ts";
import { EXAMPLE_SECTIONS } from "./example-sections.ts";
import { exampleNames, exampleProviders } from "./example-sources.ts";
import { callsSave } from "./live-versions.ts";

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

  it("has one page at most calling save(), so the one note save() writes is that page's", () => {
    const saving = EXAMPLE_SECTIONS.filter(({ name }) => callsSave(name));
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
