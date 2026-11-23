import { describe, expect, it } from "vitest";
import { EXAMPLES_PAGE_ROUTE, EXAMPLES_ROUTES } from "../examples/example-sections.ts";
import { BUILDER_PAGE, PRIVACY_PAGE } from "./footer-pages.ts";
import { docRoute, REPO_DOCS } from "./repo-docs.ts";
import { navCurrent, SITE_NAV_LINKS, type SiteNavLink } from "./site-nav.ts";

const link = (label: string) => SITE_NAV_LINKS.find((each) => each.label === label) as SiteNavLink;

/** The link marked on `path`, with its `aria-current`, as the header marks it. */
const marked = (path: string) =>
  SITE_NAV_LINKS.flatMap((each) => {
    const current = navCurrent(each, path);
    return current === undefined ? [] : [[each.label, current]];
  });

describe("navCurrent", () => {
  it("marks Documentation as a section on a reference page", () => {
    expect(marked(docRoute("store"))).toEqual([["Documentation", "true"]]);
    expect(marked(docRoute("migrating"))).toEqual([["Documentation", "true"]]);
  });

  it("marks Documentation as a section on the page it links", () => {
    expect(link("Documentation").href).toBe(docRoute("getting-started"));
    expect(marked(docRoute("getting-started"))).toEqual([["Documentation", "true"]]);
  });

  it("links Examples to the examples page, and marks it there, on every hub and example's page, and not on the home page", () => {
    expect(link("Examples").href).toBe(EXAMPLES_PAGE_ROUTE);
    expect(EXAMPLES_ROUTES).toContain("/examples/markers/");
    expect(EXAMPLES_ROUTES).toContain("/examples/markers/simple/");
    expect(EXAMPLES_ROUTES[0]).toBe(EXAMPLES_PAGE_ROUTE);
    for (const route of EXAMPLES_ROUTES)
      expect(marked(route), route).toEqual([["Examples", "true"]]);
    expect(marked("/")).toEqual([]);
  });

  it("marks nothing on the builder's page, which the footer links", () => {
    expect(marked(BUILDER_PAGE.route)).toEqual([]);
  });

  it("marks nothing on the privacy page", () => {
    expect(marked(PRIVACY_PAGE.route)).toEqual([]);
  });

  it("leaves no reference page unmarked", () => {
    for (const { id } of REPO_DOCS) expect(marked(docRoute(id))).toHaveLength(1);
  });
});
