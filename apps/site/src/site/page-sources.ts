import { PACKAGE_DIR } from "../../../../scripts/build/package.ts";
import { CHANGELOG_FILE } from "../../../../scripts/docs/changelog-lines.ts";
import { EXAMPLE_GROUPS, type ExampleGroup, groupPath } from "../examples/example-sections.ts";
import { HOME_ROUTE } from "../examples/home-page.ts";
import { AGENTS_PAGE, BUILDER_PAGE, CHANGELOG_PAGE, PRIVACY_PAGE } from "./footer-pages.ts";
import { docRoute, REPO_DOCS, repoDoc } from "./repo-docs.ts";

/** What the privacy page says: the page, and who runs the site. */
export const PRIVACY_SOURCES: readonly string[] = [
  "apps/site/src/pages/privacy.astro",
  "apps/site/src/site/site-owner.ts",
];

/** Where each feature's texts and reference cuts are (`example-groups.ts`). */
const GROUPS_DIR = "apps/site/src/examples/groups";

/** What every examples' page draws from them: the features' order, which numbers the examples, and the H1's tail. */
const GROUPS_ORDER = [
  "apps/site/src/examples/example-groups.ts",
  "apps/site/src/examples/example-sections.ts",
];

/**
 * What the home page says: the hero its own texts and quick-start's files raw, the install box the
 * README's snippets, and the index every feature's texts.
 */
const HOME_PAGE_TEXT = [
  "apps/site/src/examples/home-page.ts",
  "apps/site/src/components/Hero.astro",
  "apps/site/src/components/InstallBox.astro",
  "README.md",
  `${PACKAGE_DIR}/examples/quick-start`,
  GROUPS_DIR,
  ...GROUPS_ORDER,
];

/**
 * What a feature's page says: its texts, its examples, the shared data and stylesheets they draw,
 * and the reference docs its tables are cut from.
 */
function groupPageText(group: ExampleGroup): string[] {
  const docs = new Set(group.references.map(({ doc }) => repoDoc(doc).file));
  return [
    `${GROUPS_DIR}/${group.id}.ts`,
    ...GROUPS_ORDER,
    ...group.sections.map(({ name }) => `${PACKAGE_DIR}/examples/${name}`),
    `${PACKAGE_DIR}/examples/data`,
    `${PACKAGE_DIR}/examples/styles`,
    ...docs,
  ];
}

/** The files each route shows the words of: a change to the site's layout dates no page. */
const SOURCES_BY_ROUTE: ReadonlyMap<string, readonly string[]> = new Map([
  [HOME_ROUTE, HOME_PAGE_TEXT],
  ...EXAMPLE_GROUPS.map((group): [string, readonly string[]] => [
    groupPath(group),
    groupPageText(group),
  ]),
  ...REPO_DOCS.map(({ id, file }): [string, readonly string[]] => [docRoute(id), [file]]),
  [BUILDER_PAGE.route, ["apps/site/src/pages/builder.astro"]],
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
