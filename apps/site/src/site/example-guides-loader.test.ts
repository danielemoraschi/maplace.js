import type { LoaderContext } from "astro/loaders";
import { describe, expect, it } from "vitest";
import { EXAMPLE_SECTIONS } from "../examples/example-sections.ts";
import { exampleGuides, exampleGuidesLoader } from "./example-guides-loader.ts";

describe("exampleGuides", () => {
  it("reads each example's guide, the custom list's among them", () => {
    const guide = exampleGuides().find(({ name }) => name === "custom-list");
    expect(guide?.markdown).toMatch(/^# Your own list/);
  });
});

describe("an example's guide", () => {
  it("is titled as its section, the title GitHub shows matching the site's", () => {
    for (const { name, markdown } of exampleGuides()) {
      const section = EXAMPLE_SECTIONS.find((each) => each.name === name);
      expect(markdown.split("\n")[0], name).toBe(`# ${section?.title}`);
    }
  });
});

describe("exampleGuidesLoader", () => {
  it("stores each guide by its example's name, rendered with its links working on the site", async () => {
    const entries: { id: string; body: string; rendered: { html: string } }[] = [];
    const context = {
      store: {
        clear: () => entries.splice(0),
        set: (entry: (typeof entries)[number]) => entries.push(entry),
      },
      renderMarkdown: async (markdown: string) => ({ html: markdown }),
    };
    await exampleGuidesLoader().load(context as unknown as LoaderContext);
    expect(entries.map(({ id }) => id)).toEqual(exampleGuides().map(({ name }) => name));
    const customList = entries.find(({ id }) => id === "custom-list");
    expect(customList?.rendered.html).toContain("](/element/#list-views)");
    expect(customList?.rendered.html).not.toMatch(/^# /);
    expect(customList?.body).toBe(customList?.rendered.html);
  });
});
