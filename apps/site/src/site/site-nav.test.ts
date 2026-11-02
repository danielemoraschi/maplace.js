import { describe, expect, it } from "vitest";
import { EXAMPLE_GROUPS, groupPath } from "../examples/example-sections.ts";
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

  it("marks Examples on no group's page: the group bar does", () => {
    for (const group of EXAMPLE_GROUPS) expect(marked(groupPath(group))).toEqual([]);
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
