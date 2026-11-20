import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PACKAGE_DIR, ROOT } from "../../../../scripts/build/package.ts";
import { CHANGELOG_FILE } from "../../../../scripts/docs/changelog-lines.ts";
import { EXAMPLE_GROUPS, EXAMPLE_PAGE_ENTRIES, groupPath } from "../examples/example-sections.ts";
import { AGENTS_PAGE, BUILDER_PAGE, CHANGELOG_PAGE, PRIVACY_PAGE } from "./footer-pages.ts";
import { PRIVACY_SOURCES, pageSources } from "./page-sources.ts";
import { docRoute, REPO_DOCS } from "./repo-docs.ts";
import { SITE_ROUTES } from "./site-routes.ts";

describe("pageSources", () => {
  it("has sources for every route of the site, each a path in the repo", () => {
    for (const route of SITE_ROUTES) {
      const sources = pageSources(route);
      expect(sources.length, route).toBeGreaterThan(0);
      for (const source of sources) expect(existsSync(resolve(ROOT, source)), source).toBe(true);
    }
  });

  it("throws naming a route it doesn't know", () => {
    expect(() => pageSources("/nowhere/")).toThrow("/nowhere/");
  });

  it("dates a doc's page from its document", () => {
    for (const { id, file } of REPO_DOCS) expect(pageSources(docRoute(id)), id).toEqual([file]);
  });

  it("dates an example's page from its example, its category's texts and the shared data and stylesheets", () => {
    for (const { group, section, path } of EXAMPLE_PAGE_ENTRIES) {
      const sources = pageSources(path);
      expect(sources, section.name).toEqual(
        expect.arrayContaining([
          `${PACKAGE_DIR}/examples/${section.name}`,
          `apps/site/src/examples/groups/${group.id}.ts`,
          `${PACKAGE_DIR}/examples/data`,
          `${PACKAGE_DIR}/examples/styles`,
        ]),
      );
    }
  });

  it("dates a hub from its texts and the reference docs its tables are cut from, not its examples' code", () => {
    const sources = pageSources("/examples/markers/");
    expect(sources).toContain("apps/site/src/examples/groups/markers.ts");
    expect(sources).toContain("docs/reference/locations.md");
    expect(sources).toContain("docs/reference/store.md");
    for (const group of EXAMPLE_GROUPS)
      expect(pageSources(groupPath(group)).join(), group.id).not.toContain(`${PACKAGE_DIR}/`);
  });

  it("dates the examples page from its texts and every category's", () => {
    expect(pageSources("/examples/")).toEqual([
      "apps/site/src/examples/examples-page.ts",
      "apps/site/src/examples/groups",
      "apps/site/src/examples/example-groups.ts",
      "apps/site/src/examples/example-sections.ts",
    ]);
  });

  it("dates the home page from its hero, its install box and the index's texts", () => {
    expect(pageSources("/")).toEqual(
      expect.arrayContaining([
        "apps/site/src/examples/home-page.ts",
        "apps/site/src/components/Hero.astro",
        "README.md",
        "apps/site/src/examples/groups",
      ]),
    );
  });

  it("dates the changelog's page from the changelog", () => {
    expect(pageSources(CHANGELOG_PAGE.route)).toEqual([CHANGELOG_FILE]);
  });

  it("dates the AI agents page from the page and its links", () => {
    expect(pageSources(AGENTS_PAGE.route)).toEqual([
      "apps/site/src/pages/agents.astro",
      "apps/site/src/site/agent-links.ts",
    ]);
  });

  it("dates the builder's page from the page", () => {
    expect(pageSources(BUILDER_PAGE.route)).toEqual(["apps/site/src/pages/builder.astro"]);
  });

  it("dates the privacy page from what it says", () => {
    expect(pageSources(PRIVACY_PAGE.route)).toBe(PRIVACY_SOURCES);
  });
});
