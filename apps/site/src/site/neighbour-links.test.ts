import { describe, expect, it } from "vitest";
import { EXAMPLE_GROUPS, EXAMPLE_PAGE_ENTRIES } from "../examples/example-sections.ts";
import { exampleLink, hubLink } from "./examples-menu.ts";
import { withNeighbours } from "./neighbour-links.ts";

describe("withNeighbours", () => {
  it("links each item to the ones before and after it, none before the first or after the last", () => {
    const linked = withNeighbours(EXAMPLE_GROUPS, hubLink);
    const [first, second] = EXAMPLE_GROUPS;
    expect(linked[0]).toEqual({
      item: first,
      previous: undefined,
      next: second && hubLink(second),
    });
    expect(linked[1]?.previous).toEqual(first && hubLink(first));
    expect(linked.at(-1)?.next).toBeUndefined();
  });

  it("links an example's page to its neighbours across the categories", () => {
    const linked = withNeighbours(EXAMPLE_PAGE_ENTRIES, exampleLink);
    // Lists and menus' first example, after the last of Markers and popups.
    const first = EXAMPLE_PAGE_ENTRIES.findIndex(({ path }) => path === "/examples/lists/menu/");
    expect(linked[first - 1]?.next).toEqual({
      href: "/examples/lists/menu/",
      label: "Select menu",
    });
  });
});
