import { describe, expect, it } from "vitest";
import { EXAMPLES_PAGE_ROUTE, findExamplePage, groupPath } from "../examples/example-sections.ts";
import { HOME_ROUTE } from "../examples/home-page.ts";
import { breadcrumbsFor } from "./breadcrumbs.ts";
import { CHANGELOG_PAGE } from "./footer-pages.ts";
import { docRoute } from "./repo-docs.ts";
import { SITE_ROUTES } from "./site-routes.ts";

const HOME = { name: "Maplace.js", path: HOME_ROUTE };
const EXAMPLES = { name: "Examples", path: EXAMPLES_PAGE_ROUTE };

describe("breadcrumbsFor", () => {
  it("gives the home page no trail", () => {
    expect(breadcrumbsFor(HOME_ROUTE)).toBeUndefined();
  });

  it("leads an example's page through Examples and its hub, ending on itself", () => {
    const entry = findExamplePage("big");
    if (entry === undefined) throw new Error("no page for big");
    expect(breadcrumbsFor(entry.path)).toEqual([
      HOME,
      EXAMPLES,
      { name: entry.group.label, path: groupPath(entry.group) },
      { name: entry.section.title, path: entry.path },
    ]);
    expect(breadcrumbsFor(groupPath(entry.group))).toEqual([
      HOME,
      EXAMPLES,
      { name: entry.group.label, path: groupPath(entry.group) },
    ]);
    expect(breadcrumbsFor(EXAMPLES_PAGE_ROUTE)).toEqual([HOME, EXAMPLES]);
  });

  it("leads a doc and a footer page from Home", () => {
    expect(breadcrumbsFor(docRoute("locations"))).toEqual([
      HOME,
      { name: "Locations", path: docRoute("locations") },
    ]);
    expect(breadcrumbsFor(CHANGELOG_PAGE.route)).toEqual([
      HOME,
      { name: "Changelog", path: CHANGELOG_PAGE.route },
    ]);
  });

  it("gives every page but home a trail ending on itself", () => {
    for (const route of SITE_ROUTES.filter((route) => route !== HOME_ROUTE))
      expect(breadcrumbsFor(route)?.at(-1)?.path, route).toBe(route);
  });

  it("throws on a route it doesn't know", () => {
    expect(() => breadcrumbsFor("/nowhere/")).toThrow("/nowhere/");
  });
});
