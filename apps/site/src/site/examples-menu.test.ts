import { describe, expect, it } from "vitest";
import { EXAMPLE_GROUPS, EXAMPLE_PAGE_ENTRIES } from "../examples/example-sections.ts";
import { exampleLink, examplesMenu } from "./examples-menu.ts";

describe("examplesMenu", () => {
  it("lists every category linking its hub, each with its examples linking their pages, in order", () => {
    const menu = examplesMenu();
    expect(menu.map(({ href, label }) => [href, label])).toEqual(
      EXAMPLE_GROUPS.map(({ id, label }) => [`/examples/${id}/`, label]),
    );
    const [markers] = menu;
    expect(markers?.children?.slice(0, 2)).toEqual([
      { href: "/examples/markers/simple/", label: "One marker" },
      { href: "/examples/markers/markers/", label: "Custom marker icons" },
    ]);
    expect(menu.flatMap(({ children = [] }) => children)).toEqual(
      EXAMPLE_PAGE_ENTRIES.map(exampleLink),
    );
  });
});
