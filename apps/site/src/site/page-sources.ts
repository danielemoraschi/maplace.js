import { PACKAGE_DIR } from "../../../../scripts/build/package.ts";
import { CHANGELOG_FILE } from "../../../../scripts/docs/changelog-lines.ts";
import {
  EXAMPLE_GROUPS,
  EXAMPLE_PAGE_ENTRIES,
  EXAMPLES_PAGE_ROUTE,
  type ExampleGroup,
  type ExamplePageEntry,
  groupPath,
} from "../examples/example-sections.ts";
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

/** What every examples page draws from them: the categories' order, which numbers the examples, and the H1's tail. */
const GROUPS_ORDER = [
  "apps/site/src/examples/example-groups.ts",
  "apps/site/src/examples/example-sections.ts",
];

/** What an index of every example says (`ExampleCategories.astro`): every category's texts. */
const INDEX_TEXT = [GROUPS_DIR, ...GROUPS_ORDER];

/**
 * What the home page says (W66): its own words and the hero's, the Simple example its four ways
 * show, the npm and skills commands its pills copy, and the index every feature's texts.
 */
const HOME_PAGE_TEXT = [
  "apps/site/src/examples/home-page.ts",
  "apps/site/src/components/Hero.astro",
  `${PACKAGE_DIR}/examples/simple`,
  "apps/site/src/site/install-loader.ts",
  "apps/site/src/site/agent-links.ts",
  ...INDEX_TEXT,
];

/** What the examples page says: its own texts, and its index's. */
const EXAMPLES_PAGE_TEXT = ["apps/site/src/examples/examples-page.ts", ...INDEX_TEXT];

/** What a category's hub says: its texts, its examples' titles, and the reference docs its tables are cut from. */
function hubText(group: ExampleGroup): string[] {
  const docs = new Set(group.references.map(({ doc }) => repoDoc(doc).file));
  return [`${GROUPS_DIR}/${group.id}.ts`, ...GROUPS_ORDER, ...docs];
}

/** What an example's page says: its texts, its example, and the shared data and stylesheets it draws. */
function examplePageText({ group, section }: ExamplePageEntry): string[] {
  return [
    `${GROUPS_DIR}/${group.id}.ts`,
    ...GROUPS_ORDER,
    `${PACKAGE_DIR}/examples/${section.name}`,
    `${PACKAGE_DIR}/examples/data`,
    `${PACKAGE_DIR}/examples/styles`,
  ];
}

/** The files each route shows the words of: a change to the site's layout dates no page. */
const SOURCES_BY_ROUTE: ReadonlyMap<string, readonly string[]> = new Map([
  [HOME_ROUTE, HOME_PAGE_TEXT],
  [EXAMPLES_PAGE_ROUTE, EXAMPLES_PAGE_TEXT],
  ...EXAMPLE_GROUPS.map((group): [string, readonly string[]] => [groupPath(group), hubText(group)]),
  ...EXAMPLE_PAGE_ENTRIES.map((entry): [string, readonly string[]] => [
    entry.path,
    examplePageText(entry),
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
