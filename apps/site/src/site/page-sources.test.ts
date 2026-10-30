import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PACKAGE_DIR, ROOT } from "../../../../scripts/build/package.ts";
import { CHANGELOG_FILE } from "../../../../scripts/docs/changelog-lines.ts";
import { EXAMPLE_GROUPS, groupPath } from "../examples/example-sections.ts";
import { AGENTS_PAGE, CHANGELOG_PAGE, PRIVACY_PAGE } from "./footer-pages.ts";
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

  it("dates a group's page from each of its examples", () => {
    for (const group of EXAMPLE_GROUPS) {
      const sources = pageSources(groupPath(group));
      for (const { name } of group.sections) {
        expect(sources, group.id).toContain(`${PACKAGE_DIR}/examples/${name}`);
      }
    }
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

  it("dates the privacy page from what it says", () => {
    expect(pageSources(PRIVACY_PAGE.route)).toBe(PRIVACY_SOURCES);
  });
});
