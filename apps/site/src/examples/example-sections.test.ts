import { describe, expect, it } from "vitest";
import { EXAMPLE_SECTIONS } from "./example-sections.ts";
import { exampleNames, exampleSources } from "./example-sources.ts";

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
    const saving = EXAMPLE_SECTIONS.filter(({ name }) =>
      exampleSources(name).some(({ kind, code }) => kind === "html" && code.includes("save(")),
    );
    expect(saving.map(({ name }) => name)).toEqual(["polygon"]);
  });
});
