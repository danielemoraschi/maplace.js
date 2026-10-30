import { PACKAGE_DIR } from "../../../../scripts/build/package.ts";
import { CHANGELOG_FILE } from "../../../../scripts/docs/changelog-lines.ts";
import { EXAMPLE_GROUPS, groupPath } from "../examples/example-sections.ts";
import { AGENTS_PAGE, CHANGELOG_PAGE, PRIVACY_PAGE } from "./footer-pages.ts";
import { docRoute, REPO_DOCS } from "./repo-docs.ts";

/** What the privacy page says: the page, and who runs the site. */
export const PRIVACY_SOURCES: readonly string[] = [
  "apps/site/src/pages/privacy.astro",
  "apps/site/src/site/site-owner.ts",
];

/**
 * What every group's page says besides its examples: the hero shows quick-start's files raw, the
 * install box the README's snippets, and the examples draw the shared data.
 */
const EXAMPLE_PAGE_TEXT = [
  "apps/site/src/examples/example-sections.ts",
  "apps/site/src/components/Hero.astro",
  "apps/site/src/components/InstallBox.astro",
  "README.md",
  `${PACKAGE_DIR}/examples/quick-start`,
  `${PACKAGE_DIR}/examples/data`,
];

/** The files each route shows the words of: a change to the site's layout dates no page. */
const SOURCES_BY_ROUTE: ReadonlyMap<string, readonly string[]> = new Map([
  ...EXAMPLE_GROUPS.map((group): [string, readonly string[]] => [
    groupPath(group),
    [...group.sections.map(({ name }) => `${PACKAGE_DIR}/examples/${name}`), ...EXAMPLE_PAGE_TEXT],
  ]),
  ...REPO_DOCS.map(({ id, file }): [string, readonly string[]] => [docRoute(id), [file]]),
  [PRIVACY_PAGE.route, PRIVACY_SOURCES],
  [CHANGELOG_PAGE.route, [CHANGELOG_FILE]],
  [AGENTS_PAGE.route, ["apps/site/src/pages/agents.astro", "apps/site/src/site/agent-links.ts"]],
]);

/** The repo files that date `route`'s page. Throws for a route it doesn't know, so none goes undated. */
export function pageSources(route: string): readonly string[] {
  const sources = SOURCES_BY_ROUTE.get(route);
  if (sources === undefined) {
    throw new Error(
      `${route} has no entry in page-sources.ts: a page's date comes from its sources`,
    );
  }
  return sources;
}
