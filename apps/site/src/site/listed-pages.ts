import {
  EXAMPLE_GROUPS,
  EXAMPLE_PAGE_ENTRIES,
  EXAMPLES_PAGE_ROUTE,
  groupDescription,
  groupPath,
} from "../examples/example-sections.ts";
import { EXAMPLES_DESCRIPTION } from "../examples/examples-page.ts";
import { HOME_DESCRIPTION, HOME_ROUTE } from "../examples/home-page.ts";
import { FOOTER_PAGES } from "./footer-pages.ts";
import { SITE_NAME } from "./head-meta-tags.ts";
import { docRoute, REPO_DOCS } from "./repo-docs.ts";

/** A page as lists of the site's pages name it: `llms.txt`'s, and search's breadcrumbs. */
export interface ListedPage {
  readonly name: string;
  readonly description: string;
}

/** Each page's name and description, by its route. */
const LISTED_PAGES: ReadonlyMap<string, ListedPage> = new Map([
  [HOME_ROUTE, { name: SITE_NAME, description: HOME_DESCRIPTION }] as const,
  [EXAMPLES_PAGE_ROUTE, { name: "Examples", description: EXAMPLES_DESCRIPTION }] as const,
  ...EXAMPLE_GROUPS.map(
    (group) =>
      [groupPath(group), { name: group.label, description: groupDescription(group) }] as const,
  ),
  ...EXAMPLE_PAGE_ENTRIES.map(
    ({ path, section }) =>
      [path, { name: section.title, description: section.description }] as const,
  ),
  ...FOOTER_PAGES.map(
    ({ route, label, description }) => [route, { name: label, description }] as const,
  ),
  ...REPO_DOCS.map(
    ({ id, label, description }) => [docRoute(id), { name: label, description }] as const,
  ),
]);

/** The name and description of the page at `route`; throws where the site has none. */
export function listedPage(route: string): ListedPage {
  const page = LISTED_PAGES.get(route);
  if (page === undefined) throw new Error(`the site has no page at ${route}`);
  return page;
}
